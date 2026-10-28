
const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        unique: true,
        required: true
    },

    companyName: {
        type: String,
        required: true,
        trim: true
    },

    jobRole: {
        type: String,
        required: true,
        trim: true
    },

    jobType: {
        type: String,
        enum: ["Full-time", "Internship", "Contract"],
        required: true
    },

    appliedDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return value <= today;
            },
            message: "Applied date cannot be in the future."
        }
    },

    expectedSalary: {
        type: Number,
        min: 0,
        default: null
    },

    notes: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: [
            "Applied",
            "Interview",
            "Offer",
            "Rejected",
            "Accepted",
            "Declined"
        ],
        default: "Applied",
        required: true
    },

    statusHistory: {
        type: [statusHistorySchema],
        default: function() {
            return [{ status: "Applied", date: new Date() }];
        }
    },

    followUpDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

applicationSchema.index({
    companyName: 1,
    jobRole: 1,
    status: 1
});

module.exports = mongoose.model(
    "Application",
    applicationSchema
);
