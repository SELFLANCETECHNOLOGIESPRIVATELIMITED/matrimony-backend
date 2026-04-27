// scripts/removeDuplicates.js

const mongoose = require("mongoose");
const dropdown = require("../models/dropdown");

// Replace with your actual model if needed

async function removeDuplicateValues() {
    try {
        await mongoose.connect("mongodb+srv://umerfarooqdev:hireon123713@cluster0.sy63jcm.mongodb.net/");
          console.log(dropdown);
          
        const duplicates = await dropdown.aggregate([
            {
                $group: {
                    _id: "$value",
                    ids: { $push: "$_id" },
                    count: { $sum: 1 },
                },
            },
            {
                $match: {
                    count: { $gt: 1 },
                },
            },
        ]);

        for (const doc of duplicates) {
            const [keep, ...toDelete] = doc.ids;
            if (toDelete.length > 0) {
                await dropdown.deleteMany({ _id: { $in: toDelete } });
                console.log(`Deleted ${toDelete.length} duplicate(s) for value: "${doc._id}"`);
            }
        }

        console.log("✅ Duplicate cleanup completed.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error during cleanup:", err);
        process.exit(1);
    }
}

removeDuplicateValues();
