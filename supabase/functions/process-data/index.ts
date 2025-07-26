// 🎯 EDGE FUNCTION: Data Processing Demo
// This function demonstrates how to process complex data on the server side
// Use cases: Data validation, transformation, analysis, external API calls

// Import Supabase runtime types for autocomplete and error handling
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("🔄 Data Processing Function Started!");

Deno.serve(async (req) => {
    try {
        // 🛡️ CORS HANDLING: Allow browser requests from any origin
        if (req.method === "OPTIONS") {
            return new Response("ok", {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers":
                        "authorization, x-client-info, apikey, content-type",
                    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
                },
            });
        }

        

        // 📥 EXTRACT REQUEST DATA: Get the data sent from React app
        const body = await req.json().catch(() => ({}));
        const { input, userId } = body;

        // ✅ INPUT VALIDATION: Check if required data is provided
        if (!input || typeof input !== "string") {
            return new Response(
                JSON.stringify({
                    error: "Invalid input",
                    message: "Please provide a valid string to process",
                    success: false,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                },
            );
        }
        const isPalindrome = (inputData: string): boolean => {

            const cleaned = inputData.toLowerCase().replace(/[^a-z0-9]/, "");

            let left = 0;

            let right = cleaned.length - 1;

            while (left < right) {
                if (cleaned[left] !== cleaned[right]) {
                    return false;
                }
                left++;
                right--;
            }
            return true;
        }

        // 🔧 DATA PROCESSING: Perform various transformations
        console.log(`📊 Processing data for user: ${userId}`);

        // Example processing operations:
        const processedData = {
            // Original input
            original: input,

            // Text analysis
            length: input.length,
            wordCount: input.split(" ").filter((word) => word.length > 0).length,
            characterCount: input.replace(/\s/g, "").length,

            // Text transformations
            uppercase: input.toUpperCase(),
            lowercase: input.toLowerCase(),
            reversed: input.split("").reverse().join(""),

            // Advanced processing
            palindrome: isPalindrome(input),
            vowelCount: (input.match(/[aeiouAEIOU]/g) || []).length,
            consonantCount:
                (input.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || [])
                    .length,

            // Processing metadata
            processedAt: new Date().toISOString(),
            processingTime: Date.now(), // We'll calculate this at the end
        };

        // 📊 SIMULATE COMPLEX PROCESSING: Add artificial delay for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // ⏱️ CALCULATE PROCESSING TIME
        processedData.processingTime = Date.now() - processedData.processingTime;

        // 🎯 OPTIONAL: Save processing log to database (commented out for now)
        /*
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
    
        await supabase.from('processing_logs').insert({
          user_id: userId,
          input_text: input,
          word_count: processedData.wordCount,
          processed_at: new Date().toISOString()
        })
        */
        

        // 🎉 SUCCESS RESPONSE: Return processed data
        const response = {
            success: true,
            message: "Data processed successfully!",
            data: processedData,
            metadata: {
                functionName: "process-data",
                version: "1.0.0",
                runtime: "Deno",
                timestamp: new Date().toISOString(),
            },
        };

        console.log(`✅ Processing completed successfully for user: ${userId}`);

        return new Response(
            JSON.stringify(response),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            },
        );
    } catch (error) {
        // 🚨 ERROR HANDLING: Log and return user-friendly error
        console.error("❌ Processing function error:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: "Processing failed",
                message: error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
                timestamp: new Date().toISOString(),
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            },
        );
    }
    


});

/*
🎓 LEARNING NOTES:

1. 📊 DATA PROCESSING: This function shows how to:
   - Validate input data
   - Perform complex transformations
   - Calculate analytics (word count, character analysis)
   - Add artificial processing time for demonstration

2. 🔧 SERVER-SIDE BENEFITS:
   - Heavy computations don't slow down the browser
   - Secure processing (API keys, sensitive operations)
   - Consistent results across all users
   - Can access external APIs and databases

3. 🎯 REAL-WORLD USE CASES:
   - Image processing and optimization
   - Data validation and sanitization
   - Complex calculations and analytics
   - Integration with external services (email, payment, AI APIs)

4. 🛡️ BEST PRACTICES DEMONSTRATED:
   - Input validation
   - Error handling
   - CORS headers for browser compatibility
   - Detailed logging for debugging
   - Structured response format

📝 TO TEST:
1. Deploy this function: supabase functions deploy process-data
2. Use the React app to send text data
3. See the processed results with analytics and transformations
*/

// Clean the input once: remove non-alphanumeric characters and convert to lowercase

