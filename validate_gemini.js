
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const data = fs.readFileSync(envPath, 'utf8');
            const env = {};
            data.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    env[key] = value;
                }
            });
            return env;
        }
    } catch (e) {
        // failed to load .env
    }
    return {};
}

const env = loadEnv();
const API_KEY = env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    fs.writeFileSync('error_log.txt', 'Time: ' + new Date().toISOString() + '\nError: VITE_GEMINI_API_KEY not found in .env\n');
    console.error("No API KEY found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS_TO_TEST = [
    "gemini-2.5-flash-lite", // User's Request
    "gemini-2.0-flash-lite", // Likely intent
    "gemini-2.0-flash-lite-preview-02-05", // Known existence
    "gemini-1.5-flash" // What the error showed
];

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello check");
        const text = result.response.text();
        return true;
    } catch (error) {
        const errorInfo = `Time: ${new Date().toISOString()}\nModel: ${modelName}\nMessage: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error, null, 2)}\n\n`;
        fs.appendFileSync('error_log.txt', errorInfo);
        console.error(`Status for ${modelName}: Failed. See error_log.txt`);
        return false;
    }
}

async function run() {
    // Clear log
    fs.writeFileSync('error_log.txt', '--- Log Start ---\n');

    let workingModel = null;
    for (const modelName of MODELS_TO_TEST) {
        console.log(`Testing ${modelName}...`);
        const success = await testModel(modelName);
        if (success) {
            workingModel = modelName;
            console.log(`\n✅ Success with ${modelName}`);
            // We found a working one!
            break;
        }
    }

    if (workingModel) {
        console.log("VALIDATION_SUCCESS");
    } else {
        console.log("\n❌ ALL models failed.");
        process.exit(1);
    }
}

run();
