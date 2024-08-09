/** @type {import('next').NextConfig} */
const nextConfig = {
    // laod env variables
    env: {
        PINECONE_API_KEY: process.env.PINECONE_API_KEY,
        API_URL: process.env.API_URL || 'http://localhost:3001',
    },
    async headers() {
        return [
            {
                // matching all API routes
                source: "/api/:path*",
                headers: [
                    // other headers omitted for brevity...
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
                ]
            }
        ]
    }
};

export default nextConfig;
