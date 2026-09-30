module.exports = {
    apps: [
        {
            name: "nutri-app",
            cwd: __dirname,
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3005",
            instances: 1,
            exec_mode: "fork",
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "production",
                PORT: 3005,
            },
        },
    ],
};
