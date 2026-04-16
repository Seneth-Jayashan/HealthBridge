import axios from "axios";

export const notifyPatientNewPrescription = async ({
    doctorUserId,
    patientUserId,
    prescriptionId,
    medicationNames,
    startDate,
    endDate
}) => {
    if (!patientUserId) {
        return;
    }

    const notificationBaseUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006";
    const normalizedBaseUrl = notificationBaseUrl.replace(/\/$/, "");
    const endpoint = normalizedBaseUrl.endsWith("/api/notifications")
        ? normalizedBaseUrl
        : `${normalizedBaseUrl}/api/notifications`;

    const title = "New Prescription Available";
    const safeMedicationNames = medicationNames || "N/A";
    const message = `A new prescription ${prescriptionId || ""} has been created for you.`
        + ` Medications: ${safeMedicationNames}. Duration: ${startDate || "N/A"} to ${endDate || "N/A"}.`;

    await axios.post(
        endpoint,
        {
            userId: patientUserId,
            notificationType: ["SMS", "Email", "In-App"],
            notificationTemplate: "PRESCRIPTION_CREATED",
            title,
            message,
        },
        {
            headers: {
                "x-user-id": doctorUserId,
                "x-user-role": "Doctor",
            },
            timeout: 8000,
        }
    );
};
