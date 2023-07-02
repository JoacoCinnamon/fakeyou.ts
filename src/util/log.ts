import chalk from 'chalk';

let enabled = false;

// Dead simple production logging
// For debugging, just use console.log or a debugger! 🤣
export const log = {
	error(message: string): void {
		if (enabled) {
			console.error(`${chalk.bgRed` ERROR `} ${message}`);
		}
	},
	success(message: string): void {
		if (enabled) {
			console.log(`${chalk.bgGreen` SUCCESS `} ${message}`);
		}
	},
	info(message: string): void {
		if (enabled) {
			console.log(`${chalk.bgBlue` INFO `} ${message}`);
		}
	},
	warn(message: string): void {
		if (enabled) {
			console.log(`${chalk.bgYellow` WARN `} ${message}`);
		}
	},
	http(url: URL): void {
		if (enabled) {
			console.log(`${chalk.bgWhite(` HTTP ${url.host} `)} ${url.pathname}`);
		}
	}
};

export function setLogging(option: boolean): void {
	enabled = option;
}
