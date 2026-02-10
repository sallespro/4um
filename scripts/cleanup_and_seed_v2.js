import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const USER_ID = '0f07c123-07db-47cf-b979-4736fc44cefd';

async function cleanupAndSeed() {
    console.log("Cleaning up existing data...");

    // Cleanup in order of dependency
    await supabase.from("bundle_results").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
    await supabase.from("bundles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("messages").delete().eq("user_id", USER_ID);
    await supabase.from("sessions").delete().eq("user_id", USER_ID);
    await supabase.from("guided_sessions").delete().eq("user_id", USER_ID);

    console.log("Seeding guided session templates...");

    const guidedTemplates = [
        {
            title: "Company Experience",
            description: "Deep dive into our history and market impact.",
            questions: ["What is the company experience as investment bank?"]
        },
        {
            title: "Work Culture",
            description: "Exploration of our day-to-day work environment.",
            questions: ["How is the work and daily culture?"]
        },
        {
            title: "AI Project Roadmap",
            description: "Future vision and strategic roadmap.",
            questions: ["What is the roadmap for ai projects?"]
        }
    ];

    for (const t of guidedTemplates) {
        const { error } = await supabase
            .from("guided_sessions")
            .insert([{ ...t, user_id: USER_ID }]);

        if (error) {
            console.error(`Error creating template ${t.title}:`, error);
        } else {
            console.log(`Created template: ${t.title}`);
        }
    }

    console.log("Cleanup and template seeding completed!");
}

cleanupAndSeed();
