
const mongoose = require("mongoose");

const timeEntrySchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        startedAt: {
            type: Date,
            required: true
        },

        endedAt: {
            type: Date,
            default: null
        },

        durationSeconds: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["Running", "Paused"],
            default: "Running"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("TimeEntry", timeEntrySchema);
