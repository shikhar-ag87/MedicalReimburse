import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FormData } from "../types/form";

export interface ApplicationSubmissionResult {
    applicationId: string;
    applicationNumber: string;
    status: string;
    submittedAt: string;
}

export class PDFService {
    /**
     * Generate PDF from form data and submission result
     */
    static async generateApplicationPDF(
        formData: FormData,
        submissionResult: ApplicationSubmissionResult
    ): Promise<void> {
        try {
            console.log("Starting PDF generation with:", {
                formData,
                submissionResult,
            });

            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            let yPosition = margin;

            // Helper function to add text with line breaks
            const addText = (
                text: string,
                fontSize: number = 10,
                isBold: boolean = false
            ) => {
                try {
                    pdf.setFontSize(fontSize);
                    if (isBold) {
                        pdf.setFont("helvetica", "bold");
                    } else {
                        pdf.setFont("helvetica", "normal");
                    }

                    const lines = pdf.splitTextToSize(
                        text,
                        pageWidth - margin * 2
                    );
                    pdf.text(lines, margin, yPosition);
                    yPosition += lines.length * (fontSize * 0.5) + 5;

                    // Check if we need a new page
                    if (yPosition > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                } catch (error) {
                    console.error(
                        "Error adding text to PDF:",
                        error,
                        "Text:",
                        text
                    );
                }
            };

            const addSection = (title: string) => {
                yPosition += 10;
                addText(title, 14, true);
                yPosition += 5;
            };

            // Header
            pdf.setFillColor(41, 128, 185);
            pdf.rect(0, 0, pageWidth, 40, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.setFont("helvetica", "bold");
            pdf.text("JNU Medical Reimbursement Application", margin, 25);

            pdf.setTextColor(0, 0, 0);
            yPosition = 60;

            // Application Details
            addSection("Application Details");
            addText(
                `Application Number: ${submissionResult.applicationNumber}`,
                12,
                true
            );
            addText(`Application ID: ${submissionResult.applicationId}`);
            addText(`Status: ${submissionResult.status.toUpperCase()}`);
            addText(
                `Submitted At: ${new Date(
                    submissionResult.submittedAt
                ).toLocaleString()}`
            );

            // Employee Details
            addSection("Employee Details");
            addText(`Name: ${formData.employee.facultyEmployeeName}`);
            addText(`Designation: ${formData.employee.designation}`);
            addText(`Department: ${formData.employee.schoolCentreDepartment}`);
            if (formData.declaration.mobileNumber) {
                addText(`Mobile: ${formData.declaration.mobileNumber}`);
            }
            if (formData.declaration.email) {
                addText(`Email: ${formData.declaration.email}`);
            }

            // CGHS Details
            addSection("CGHS Details");
            addText(`CGHS Card Number: ${formData.employee.cghsCardNumber}`);
            addText(`CGHS Dispensary: ${formData.employee.cghsDispensary}`);
            if (formData.employee.cardValidity) {
                addText(`Card Validity: ${formData.employee.cardValidity}`);
            }
            if (formData.employee.wardEntitlement) {
                addText(
                    `Ward Entitlement: ${formData.employee.wardEntitlement}`
                );
            }

            // Patient Details
            addSection("Patient Details");
            addText(`Patient Name: ${formData.patient.patientName}`);
            addText(`Patient CGHS Card: ${formData.patient.cghsCardNumber}`);
            addText(
                `Relationship: ${formData.patient.relationshipWithEmployee}`
            );

            // Treatment Details
            addSection("Treatment Details");
            addText(`Hospital Name: ${formData.treatment.hospitalName}`);
            addText(`Hospital Address: ${formData.treatment.hospitalAddress}`);
            addText(
                `Treatment Type: ${formData.treatment.treatmentType.toUpperCase()}`
            );

            // Treatment Conditions
            addSection("Treatment Conditions");
            addText(
                `Clothes Provided: ${
                    formData.treatment.clothesProvided ? "Yes" : "No"
                }`
            );
            addText(
                `Prior Permission Required: ${
                    formData.treatment.priorPermission ? "Yes" : "No"
                }`
            );
            if (formData.treatment.permissionDetails) {
                addText(
                    `Permission Details: ${formData.treatment.permissionDetails}`
                );
            }
            addText(
                `Emergency Treatment: ${
                    formData.treatment.emergencyTreatment ? "Yes" : "No"
                }`
            );
            if (formData.treatment.emergencyDetails) {
                addText(
                    `Emergency Details: ${formData.treatment.emergencyDetails}`
                );
            }
            addText(
                `Health Insurance: ${
                    formData.treatment.healthInsurance ? "Yes" : "No"
                }`
            );
            if (formData.treatment.insuranceAmount) {
                addText(
                    `Insurance Amount: ₹${formData.treatment.insuranceAmount}`
                );
            }

            // Expense Items
            if (formData.expenses && formData.expenses.length > 0) {
                addSection("Expense Details");
                let totalAmount = 0;

                formData.expenses.forEach((expense, index) => {
                    addText(`${index + 1}. Bill Number: ${expense.billNumber}`);
                    addText(`   Date: ${expense.billDate}`);
                    addText(`   Description: ${expense.description}`);
                    addText(`   Amount: ₹${expense.amountClaimed}`);
                    totalAmount += expense.amountClaimed;
                    yPosition += 5;
                });

                addText(`Total Amount Claimed: ₹${totalAmount}`, 12, true);
            }

            // Bank Details
            if (formData.bankDetails?.bankName) {
                addSection("Bank Details");
                addText(`Bank Name: ${formData.bankDetails.bankName}`);
                if (formData.bankDetails.branchAddress) {
                    addText(
                        `Branch Address: ${formData.bankDetails.branchAddress}`
                    );
                }
                if (formData.bankDetails.accountNumber) {
                    addText(
                        `Account Number: ${formData.bankDetails.accountNumber}`
                    );
                }
                if (formData.bankDetails.ifscCode) {
                    addText(`IFSC Code: ${formData.bankDetails.ifscCode}`);
                }
            }

            // Declaration Details
            addSection("Declaration");
            if (formData.documents?.enclosures) {
                addText(
                    `Number of Enclosures: ${formData.documents.enclosures}`
                );
            }

            const documents = [];
            if (formData.documents?.photocopyCGHSCard)
                documents.push("Photocopy of CGHS Card");
            if (formData.documents?.photocopiesOriginalPrescriptions)
                documents.push("Photocopies of Original Prescriptions");
            if (formData.documents?.originalBills)
                documents.push("Original Bills");

            if (documents.length > 0) {
                addText(`Documents Attached: ${documents.join(", ")}`);
            }

            if (formData.declaration?.signature) {
                addText(`Signature: ${formData.declaration.signature}`);
            }
            if (formData.declaration?.place) {
                addText(`Place: ${formData.declaration.place}`);
            }
            if (formData.declaration?.date) {
                addText(`Date: ${formData.declaration.date}`);
            }

            // Footer
            yPosition = pageHeight - 30;
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text(
                "This is a computer generated document. No signature is required.",
                margin,
                yPosition
            );
            pdf.text(
                `Generated on: ${new Date().toLocaleString()}`,
                margin,
                yPosition + 10
            );

            // Save the PDF
            const fileName = `JNU_Medical_Application_${submissionResult.applicationNumber}.pdf`;
            console.log("Saving PDF as:", fileName);
            pdf.save(fileName);

            console.log("PDF generation completed successfully");
        } catch (error) {
            console.error("Error generating PDF:", error);
            throw error;
        }
    }

    /**
     * Generate PDF from HTML element (alternative method)
     */
    static async generatePDFFromHTML(
        elementId: string,
        filename: string = "application.pdf"
    ): Promise<void> {
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with ID '${elementId}' not found`);
        }

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(filename);
    }
}

export default PDFService;
