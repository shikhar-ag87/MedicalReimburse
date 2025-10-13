import express, { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getDatabase } from '../database/connection';
import { SupabaseConnection } from '../database/providers/supabase';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Authentication middleware for admin routes
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({ success: false, message: "Access token required" });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Invalid or expired token" });
        return;
    }
};

// Configure multer for query attachments
const queryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/query-attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadQueryAttachment = multer({
  storage: queryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents allowed.'));
    }
  },
});

// =====================================================
// 1. CREATE NEW QUERY (Admin Only)
// =====================================================
router.post('/create', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { applicationId, subject, message, priority = 'normal' } = req.body;
    const adminId = req.user?.userId;
    const adminRole = req.user?.role;

    if (!applicationId || !subject || !message) {
      res.status(400).json({ error: 'Application ID, subject, and message are required' });
      return;
    }

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    // Get application details and employee email
    const { data: application, error: appError } = await client
      .from('medical_applications')
      .select('employee_email, employee_name, application_number')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Create query
    const { data: query, error: queryError } = await client
      .from('application_queries')
      .insert({
        application_id: applicationId,
        subject,
        priority,
        created_by: adminId,
        created_by_role: adminRole,
        employee_email: application.employee_email,
        access_token: accessToken,
        token_expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (queryError || !query) {
      logger.error('Failed to create query:', queryError);
      res.status(500).json({ error: 'Failed to create query' });
      return;
    }

    // Create first message
    const adminName = req.user?.name || 'Admin';
    const { error: messageError } = await client
      .from('query_messages')
      .insert({
        query_id: query.id,
        message,
        sender_type: 'admin',
        sender_id: adminId,
        sender_name: adminName,
        sender_role: adminRole,
      });

    if (messageError) {
      logger.error('Failed to create message:', messageError);
    }

    // TODO: Send email notification to user
    const queryLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/query/${accessToken}`;
    logger.info(`📧 Email would be sent to: ${application.employee_email}`);
    logger.info(`📧 Query link: ${queryLink}`);
    logger.info(`📧 Subject: ${subject}`);

    res.status(201).json({
      message: 'Query created successfully',
      query: {
        ...query,
        queryLink,
        applicationNumber: application.application_number,
        employeeName: application.employee_name,
      },
    });
}));

// =====================================================
// 2. GET QUERIES FOR APPLICATION (Admin Only)
// =====================================================
router.get('/application/:applicationId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { applicationId } = req.params;

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    const { data: queries, error } = await client
      .from('application_queries')
      .select(`
        *,
        query_messages(count),
        query_attachments(count)
      `)
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch queries:', error);
      res.status(500).json({ error: 'Failed to fetch queries' });
      return;
    }

    res.json(queries || []);
}));

// =====================================================
// 3. GET ALL QUERIES (Admin Dashboard)
// =====================================================
router.get('/all', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { status, role } = req.query;

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    let query = client
      .from('application_queries')
      .select(`
        *,
        medical_applications(application_number, employee_name, employee_email)
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (role) {
      query = query.eq('created_by_role', role);
    }

    const { data: queries, error } = await query;

    if (error) {
      logger.error('Failed to fetch queries:', error);
      res.status(500).json({ error: 'Failed to fetch queries' });
      return;
    }

    res.json(queries || []);
}));

// =====================================================
// 4. GET QUERY DETAILS (Admin Only)
// =====================================================
router.get('/:queryId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { queryId } = req.params;

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    // Get query details
    const { data: query, error: queryError } = await client
      .from('application_queries')
      .select(`
        *,
        medical_applications(application_number, employee_name, employee_email, department),
        users(name)
      `)
      .eq('id', queryId)
      .single();

    if (queryError || !query) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }

    // Get all messages
    const { data: messages, error: messagesError } = await client
      .from('query_messages')
      .select('*')
      .eq('query_id', queryId)
      .order('created_at', { ascending: true });

    // Get all attachments
    const { data: attachments, error: attachmentsError } = await client
      .from('query_attachments')
      .select('*')
      .eq('query_id', queryId)
      .order('created_at', { ascending: true });

    // Mark as read by admin
    await client
      .from('application_queries')
      .update({ unread_by_admin: false })
      .eq('id', queryId);

    res.json({
      query,
      messages: messages || [],
      attachments: attachments || [],
    });
}));

// =====================================================
// 5. ADD MESSAGE TO QUERY (Admin Only)
// =====================================================
router.post('/:queryId/reply', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { queryId } = req.params;
    const { message, isInternalNote = false } = req.body;
    const adminId = req.user?.userId;
    const adminName = req.user?.name || 'Admin';
    const adminRole = req.user?.role;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    const { data: newMessage, error } = await client
      .from('query_messages')
      .insert({
        query_id: queryId,
        message,
        sender_type: 'admin',
        sender_id: adminId,
        sender_name: adminName,
        sender_role: adminRole,
        is_internal_note: isInternalNote,
      })
      .select()
      .single();

    if (error || !newMessage) {
      logger.error('Failed to add message:', error);
      res.status(500).json({ error: 'Failed to add message' });
      return;
    }

    // TODO: If not internal note, send email notification to user

    res.status(201).json(newMessage);
}));

// =====================================================
// 6. RESOLVE QUERY (Admin Only)
// =====================================================
router.patch('/:queryId/resolve', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { queryId } = req.params;
    const adminId = req.user?.userId;

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    const { data: query, error } = await client
      .from('application_queries')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: adminId,
      })
      .eq('id', queryId)
      .select()
      .single();

    if (error || !query) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }

    res.json(query);
}));

// =====================================================
// 7. REOPEN QUERY (Admin Only)
// =====================================================
router.patch('/:queryId/reopen', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { queryId } = req.params;

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    const { data: query, error } = await client
      .from('application_queries')
      .update({
        status: 'admin_replied',
        resolved_at: null,
        resolved_by: null,
      })
      .eq('id', queryId)
      .select()
      .single();

    if (error || !query) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }

    res.json(query);
}));

// =====================================================
// PUBLIC ENDPOINTS (No Auth Required - Token Based)
// =====================================================

// 8. GET QUERY BY TOKEN (Public - User Access)
router.get('/public/:token', asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    // Get query details
    const { data: query, error: queryError } = await client
      .from('application_queries')
      .select(`
        *,
        medical_applications(application_number, employee_name, department, total_amount_claimed)
      `)
      .eq('access_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (queryError || !query) {
      res.status(404).json({ error: 'Query not found or token expired' });
      return;
    }

    // Get messages (exclude internal notes)
    const { data: messages } = await client
      .from('query_messages')
      .select('*')
      .eq('query_id', query.id)
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true });

    // Get attachments
    const { data: attachments } = await client
      .from('query_attachments')
      .select('*')
      .eq('query_id', query.id)
      .order('created_at', { ascending: true });

    // Mark as read by user
    await client
      .from('application_queries')
      .update({ unread_by_user: false })
      .eq('id', query.id);

    res.json({
      query,
      messages: messages || [],
      attachments: attachments || [],
    });
}));

// 9. REPLY TO QUERY (Public - User)
router.post('/public/:token/reply', asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { message, userName } = req.body;

    if (!message || !userName) {
      res.status(400).json({ error: 'Message and user name are required' });
      return;
    }

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    // Verify token and get query
    const { data: query, error: queryError } = await client
      .from('application_queries')
      .select('id')
      .eq('access_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (queryError || !query) {
      res.status(404).json({ error: 'Query not found or token expired' });
      return;
    }

    // Add message
    const { data: newMessage, error: messageError } = await client
      .from('query_messages')
      .insert({
        query_id: query.id,
        message,
        sender_type: 'user',
        sender_name: userName,
      })
      .select()
      .single();

    if (messageError || !newMessage) {
      logger.error('Failed to reply:', messageError);
      res.status(500).json({ error: 'Failed to reply to query' });
      return;
    }

    // TODO: Send notification to admin

    res.status(201).json(newMessage);
}));

// 10. UPLOAD ATTACHMENT (Public - User)
router.post(
  '/public/:token/upload',
  uploadQueryAttachment.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { userName, messageId } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    // Verify token and get query
    const { data: query, error: queryError } = await client
      .from('application_queries')
      .select('id')
      .eq('access_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (queryError || !query) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Query not found or token expired' });
      return;
    }

    // Save attachment record
    const { data: attachment, error: attachError } = await client
      .from('query_attachments')
      .insert({
        query_id: query.id,
        message_id: messageId || null,
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        uploaded_by: 'user',
        uploader_name: userName,
      })
      .select()
      .single();

    if (attachError || !attachment) {
      logger.error('Failed to save attachment:', attachError);
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Failed to upload attachment' });
      return;
    }

    res.status(201).json(attachment);
  })
);

// 11. GET UNREAD QUERY COUNT (Admin Dashboard)
router.get('/stats/unread', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const db = getDatabase();
    const client = (db as SupabaseConnection).getServiceClient();

    const { data: stats, error } = await client
      .from('application_queries')
      .select('status, unread_by_admin');

    if (error) {
      logger.error('Failed to fetch stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
      return;
    }

    const unread_count = stats?.filter(q => q.unread_by_admin).length || 0;
    const open_count = stats?.filter(q => q.status === 'open').length || 0;
    const user_replied_count = stats?.filter(q => q.status === 'user_replied').length || 0;

    res.json({
      unread_count,
      open_count,
      user_replied_count,
    });
}));

export default router;
