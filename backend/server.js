
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const envFile = fs.existsSync(path.join(__dirname, ".env.local"))
  ? path.join(__dirname, ".env.local")
  : path.join(__dirname, ".env");

require("dotenv").config({ path: envFile });

const Application = require("./application");

const app = express();

app.use(cors());
app.use(express.json());

const FINAL_STATUSES = ["Rejected", "Accepted", "Declined"];

const transitions = {
    Applied: ["Interview", "Rejected"],
    Interview: ["Offer", "Rejected"],
    Offer: ["Accepted", "Declined"],
    Rejected: [],
    Accepted: [],
    Declined: []
};

function response(res, status, success, message, data = null) {
    return res.status(status).json({ success, message, data });
}

function isValidDate(value) {
    return value && !Number.isNaN(new Date(value).getTime());
}

function isFutureDate(value) {
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
}

function makeFollowUpDate(appliedDate) {
    const date = new Date(appliedDate);
    date.setDate(date.getDate() + 7);
    return date;
}

function isOverdue(application) {
    return application.status === "Applied" &&
        new Date() > application.followUpDate;
}

function sendApplication(res, application, status = 200, message = "Success") {
    return response(res, status, true, message, {
        ...application.toObject(),
        isOverdue: isOverdue(application)
    });
}

app.get("/", (req, res) => {
    response(res, 200, true, "Job Application Tracker API is running");
});

// Add application
app.post("/api/applications", async (req, res) => {
    try {
        const {
            companyName,
            jobRole,
            jobType,
            appliedDate,
            expectedSalary,
            notes,
            applicationId,
            status
        } = req.body;

        if (applicationId || status) {
            return response(
                res, 400, false,
                "Application ID and initial status cannot be set by the client."
            );
        }

        if (!companyName?.trim() || !jobRole?.trim() ||
            !jobType || !appliedDate) {
            return response(
                res, 400, false,
                "Company, role, job type and applied date are required."
            );
        }

        if (!["Full-time", "Internship", "Contract"].includes(jobType)) {
            return response(res, 400, false, "Invalid job type.");
        }

        if (!isValidDate(appliedDate) || isFutureDate(appliedDate)) {
            return response(
                res, 400, false,
                "Applied date must be valid and cannot be in the future."
            );
        }

        if (expectedSalary !== undefined &&
            expectedSalary !== null &&
            expectedSalary !== "" &&
            (!Number.isFinite(Number(expectedSalary)) ||
                Number(expectedSalary) < 0)) {
            return response(res, 400, false, "Salary must be a non-negative number.");
        }

        const company = companyName.trim();
        const role = jobRole.trim();

        const existing = await Application.find({
            companyName: { $regex: `^${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            jobRole: { $regex: `^${role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            status: { $nin: FINAL_STATUSES }
        });

        if (existing.length) {
            return response(
                res, 409, false,
                "An active application for this company and job role already exists."
            );
        }

        const prefix = company.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "JOB";

        const sequenceResult = await Application.aggregate([
            { $match: { applicationId: { $regex: `^JA-${prefix}-\\d{3,}$` } } },
            { $project: { sequence: { $toInt: { $arrayElemAt: [{ $split: ["$applicationId", "-"] }, 2] } } } },
            { $sort: { sequence: -1 } },
            { $limit: 1 }
        ]);

        const nextSequence = sequenceResult.length
            ? sequenceResult[0].sequence + 1
            : 1;

        const generatedId = `JA-${prefix}-${String(nextSequence).padStart(3, "0")}`;

        const application = await Application.create({
            applicationId: generatedId,
            companyName: company,
            jobRole: role,
            jobType,
            appliedDate: new Date(appliedDate),
            expectedSalary: expectedSalary === "" || expectedSalary == null
                ? null : Number(expectedSalary),
            notes: notes || "",
            status: "Applied",
            statusHistory: [{ status: "Applied", date: new Date() }],
            followUpDate: makeFollowUpDate(appliedDate)
        });

        return sendApplication(res, application, 201, "Application created successfully.");
    } catch (error) {
        console.error(error);
        return response(res, 400, false, error.message);
    }
});

// List, search, filter and count applications
app.get("/api/applications", async (req, res) => {
    try {
        const { status, company } = req.query;
        const filter = {};

        if (status) {
            if (!Object.keys(transitions).includes(status)) {
                return response(res, 400, false, "Invalid status filter.");
            }
            filter.status = status;
        }

        if (company) {
            filter.companyName = { $regex: company, $options: "i" };
        }

        const applications = await Application.find(filter).sort({ createdAt: -1 });

        const counts = await Application.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statusCounts = Object.fromEntries(
            Object.keys(transitions).map(s => [s, 0])
        );
        counts.forEach(item => { statusCounts[item._id] = item.count; });

        return response(res, 200, true, "Applications retrieved successfully.", {
            applications: applications.map(a => ({
                ...a.toObject(),
                isOverdue: isOverdue(a)
            })),
            statusCounts
        });
    } catch (error) {
        return response(res, 400, false, error.message);
    }
});

// View details and status history
app.get("/api/applications/:id", async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return response(res, 404, false, "Application not found.");
        }

        return sendApplication(res, application, 200, "Application retrieved successfully.");
    } catch (error) {
        return response(res, 400, false, "Invalid application ID.");
    }
});

// Edit allowed fields only
app.put("/api/applications/:id", async (req, res) => {
    try {
        const { companyName, jobRole, jobType, expectedSalary, notes } = req.body;

        if (req.body.applicationId !== undefined || req.body.appliedDate !== undefined) {
            return response(
                res, 400, false,
                "Application ID and applied date cannot be edited."
            );
        }

        const application = await Application.findById(req.params.id);

        if (!application) {
            return response(res, 404, false, "Application not found.");
        }

        if (companyName !== undefined) {
            if (!companyName.trim()) {
                return response(res, 400, false, "Company name cannot be empty.");
            }
            application.companyName = companyName.trim();
        }

        if (jobRole !== undefined) {
            if (!jobRole.trim()) {
                return response(res, 400, false, "Job role cannot be empty.");
            }
            application.jobRole = jobRole.trim();
        }

        if (jobType !== undefined) {
            if (!["Full-time", "Internship", "Contract"].includes(jobType)) {
                return response(res, 400, false, "Invalid job type.");
            }
            application.jobType = jobType;
        }

        if (expectedSalary !== undefined) {
            if (expectedSalary !== null &&
                (expectedSalary === "" || !Number.isFinite(Number(expectedSalary)) ||
                    Number(expectedSalary) < 0)) {
                return response(res, 400, false, "Invalid salary.");
            }
            application.expectedSalary = expectedSalary === "" ? null : expectedSalary;
        }

        if (notes !== undefined) application.notes = notes;

        const duplicate = await Application.findOne({
            _id: { $ne: application._id },
            companyName: { $regex: `^${application.companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            jobRole: { $regex: `^${application.jobRole.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            status: { $nin: FINAL_STATUSES }
        });

        if (duplicate && !FINAL_STATUSES.includes(application.status)) {
            return response(res, 409, false, "An active application already exists for this company and role.");
        }

        await application.save();
        return sendApplication(res, application, 200, "Application updated successfully.");
    } catch (error) {
        return response(res, 400, false, error.message);
    }
});

// Change status with enforced workflow
app.patch("/api/applications/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!Object.keys(transitions).includes(status)) {
            return response(res, 400, false, "Invalid status.");
        }

        const application = await Application.findById(req.params.id);

        if (!application) {
            return response(res, 404, false, "Application not found.");
        }

        if (!transitions[application.status].includes(status)) {
            return response(
                res, 400, false,
                `Cannot change status from ${application.status} to ${status}.`
            );
        }

        application.status = status;
        application.statusHistory.push({ status, date: new Date() });
        await application.save();

        return sendApplication(res, application, 200, "Status updated successfully.");
    } catch (error) {
        return response(res, 400, false, error.message);
    }
});

// Delete only Applied or final status applications
app.delete("/api/applications/:id", async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return response(res, 404, false, "Application not found.");
        }

        if (["Interview", "Offer"].includes(application.status)) {
            return response(
                res, 400, false,
                "Applications in Interview or Offer status cannot be deleted."
            );
        }

        await application.deleteOne();
        return response(res, 200, true, "Application deleted successfully.");
    } catch (error) {
        return response(res, 400, false, error.message);
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error.message);
    });
