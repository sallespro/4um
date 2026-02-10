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

    console.log("Seeding test sessions...");

    const testSessions = [
        {
            title: "Company Experience",
            messages: [
                { role: "user", content: "Tell me about the overall experience of working at this company." },
                { role: "assistant", content: "The company offers a world-class experience with a focus on innovation and employee growth. We have been recognized for our excellence in cloud computing and AI research over the past 5 years. Our environment promotes high ownership and continuous learning." }
            ]
        },
        {
            title: "Work Culture",
            messages: [
                { role: "user", content: "How is the day-to-day work environment and culture?" },
                { role: "assistant", content: "The work environment is highly collaborative and flexible. We follow a hybrid model that balances deep focus with team synergy. Our culture is built on radical transparency and mutual respect, fostering an inclusive atmosphere for all." }
            ]
        },
        {
            title: "AI Project Roadmap",
            messages: [
                { role: "user", content: "What is the strategic roadmap for AI projects in the next 24 months?" },
                { role: "assistant", content: "Over the next 2 years, we are focusing on: \n1. Autonomous Agentic Workflows\n2. Real-time RAG Pipeline optimization\n3. Multi-modal AI integration for enterprise clients.\nThe roadmap is divided into four quarterly phases each year, targeting full automation by Q4 of next year." }
            ]
        }
    ];

    for (const s of testSessions) {
        const { data: session, error: sErr } = await supabase
            .from("sessions")
            .insert([{ title: s.title, user_id: USER_ID }])
            .select()
            .single();

        if (sErr) {
            console.error(`Error creating session ${s.title}:`, sErr);
            continue;
        }

        const messagesToInsert = s.messages.map(m => ({
            session_id: session.id,
            user_id: USER_ID,
            role: m.role,
            content: m.content
        }));

        const { error: mErr } = await supabase.from("messages").insert(messagesToInsert);
        if (mErr) {
            console.error(`Error creating messages for ${s.title}:`, mErr);
        } else {
            console.log(`Created session: ${s.title}`);
        }
    }

    console.log("Cleanup and seeding completed!");
}

cleanupAndSeed();
