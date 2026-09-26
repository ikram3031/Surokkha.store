import { logger } from "../config/logger.js";
// 
import { closeDatabase } from "../database/index.js";

export const createShutdownHandler = (server) => {
	let isShuttingDown = false;

	return async (reason) => {
		if (isShuttingDown) {
			return;
		}

		isShuttingDown = true;
		logger.info({ reason }, "Shutdown initiated");

		server.close(async (closeError) => {
			if (closeError) {
				logger.error({ err: closeError }, "HTTP server failed to close");
				process.exit(1);
			}

			/*
			try {
				await closeMySQL();
				logger.info("MySQL connection pool closed successfully");
			} catch (error) {
				logger.error({ err: error }, "Error closing MySQL connection");
			}
			*/

			try {
				await closeDatabase();
				logger.info("MongoDB connection closed successfully");
			} catch (error) {
				logger.error({ err: error }, "Error closing MongoDB connection");
			}

			process.exit(0);
		});

		setTimeout(() => {
			logger.warn("Forcing process exit after timeout");
			process.exit(1);
		}, 10000).unref();
	};
};
