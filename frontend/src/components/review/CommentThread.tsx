import { useState } from "react";
import { MessageCircle, Send, User, Clock, CheckCircle } from "lucide-react";

interface CommentThreadProps {
    applicationId: string;
    comments: ReviewComment[];
    onAddComment: (comment: string, isInternal?: boolean) => Promise<void>;
    onResolveComment: (commentId: string) => Promise<void>;
    currentUserId: string;
    currentUserRole: string;
}

interface ReviewComment {
    id: string;
    application_id: string;
    reviewer_id: string;
    reviewer_name?: string;
    reviewer_role: string;
    comment_text: string;
    comment_type:
        | "inquiry"
        | "clarification"
        | "observation"
        | "recommendation";
    is_resolved: boolean;
    created_at: string;
}

const CommentThread: React.FC<CommentThreadProps> = ({
    applicationId,
    comments,
    onAddComment,
    onResolveComment,
    currentUserId,
    currentUserRole,
}) => {
    const [newComment, setNewComment] = useState("");
    const [commentType, setCommentType] = useState<
        "inquiry" | "clarification" | "observation" | "recommendation"
    >("observation");
    const [isInternal, setIsInternal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showResolved, setShowResolved] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            await onAddComment(newComment.trim(), isInternal);
            setNewComment("");
            setCommentType("observation");
            setIsInternal(false);
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (commentId: string) => {
        try {
            await onResolveComment(commentId);
        } catch (error) {
            console.error("Error resolving comment:", error);
        }
    };

    const filteredComments = showResolved
        ? comments
        : comments.filter((c) => !c.is_resolved);

    const sortedComments = [...filteredComments].sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const getCommentTypeColor = (type: string) => {
        const colors = {
            inquiry: "bg-blue-100 text-blue-800 border-blue-300",
            clarification: "bg-yellow-100 text-yellow-800 border-yellow-300",
            observation: "bg-purple-100 text-purple-800 border-purple-300",
            recommendation: "bg-green-100 text-green-800 border-green-300",
        };
        return colors[type as keyof typeof colors] || colors.observation;
    };

    const getRoleBadgeColor = (role: string) => {
        const colors = {
            admin: "bg-indigo-100 text-indigo-800",
            medical_officer: "bg-teal-100 text-teal-800",
            super_admin: "bg-red-100 text-red-800",
        };
        return (
            colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Review Comments ({comments.length})
                </h3>
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showResolved}
                        onChange={(e) => setShowResolved(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-600">Show resolved</span>
                </label>
            </div>

            {/* Add Comment Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "inquiry",
                            "clarification",
                            "observation",
                            "recommendation",
                        ].map((type) => (
                            <label
                                key={type}
                                className="flex items-center space-x-2 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="commentType"
                                    value={type}
                                    checked={commentType === type}
                                    onChange={(e) =>
                                        setCommentType(e.target.value as any)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span
                                    className={`px-2 py-1 rounded-full border text-xs font-medium ${getCommentTypeColor(
                                        type
                                    )}`}
                                >
                                    {type.charAt(0).toUpperCase() +
                                        type.slice(1)}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mb-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add your comment or observation..."
                        disabled={loading}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-600">
                            Internal Comment (not visible to employee)
                        </span>
                    </label>
                    <button
                        type="submit"
                        disabled={loading || !newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Posting...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Post Comment</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
                {sortedComments.map((comment) => (
                    <div
                        key={comment.id}
                        className={`border rounded-lg p-4 ${
                            comment.is_resolved
                                ? "bg-gray-50 border-gray-300 opacity-75"
                                : "bg-white border-gray-200"
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {comment.reviewer_name || "Reviewer"}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                                comment.reviewer_role
                                            )}`}
                                        >
                                            {comment.reviewer_role
                                                .replace("_", " ")
                                                .toUpperCase()}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getCommentTypeColor(
                                                comment.comment_type
                                            )}`}
                                        >
                                            {comment.comment_type}
                                        </span>
                                        {comment.is_resolved && (
                                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>Resolved</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                    {new Date(
                                        comment.created_at
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                            {comment.comment_text}
                        </p>

                        {!comment.is_resolved && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleResolve(comment.id)}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                                >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Mark as Resolved</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {sortedComments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>
                            {showResolved
                                ? "No comments yet"
                                : "No unresolved comments"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentThread;
