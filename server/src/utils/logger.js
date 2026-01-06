const logger = {
    info: (message, meta = {}) => {
        console.log(JSON.stringify({ level: 'info', message, timestamp: new Date(), ...meta }));
    },
    error: (message, error) => {
        console.error(JSON.stringify({ level: 'error', message, timestamp: new Date(), error: error?.message || error }));
    },
    warn: (message, meta = {}) => {
        console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date(), ...meta }));
    },
};

export default logger;
