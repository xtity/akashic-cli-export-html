import * as cmn from "@akashic/akashic-cli-commons";
import { TransferTemplateParameterObject, promiseTransfer } from "./transfer";
import * as fs from "fs";
import * as path from "path";

export interface ExportHTMLParameterObject extends TransferTemplateParameterObject {
	cwd?: string;
};

export function _completeExportHTMLParameterObject(param: ExportHTMLParameterObject): void {
	param.cwd = param.cwd || process.cwd();
	param.logger = param.logger || new cmn.ConsoleLogger();
}
export function promiseExportHTML(param: ExportHTMLParameterObject): Promise<void> {
	_completeExportHTMLParameterObject(param);
	const restoreDirectory: (err?: any) => Promise<void> = cmn.Util.chdir(param.cwd);

	if (!param.output) {
		return Promise.reject("--output option must be specified.");
	}

	return new Promise((resolve, reject) => {
		fs.stat(path.resolve(param.output), (error: any, stat: any) => {
			if (error) {
				if (error.code !== "ENOENT") {
					reject("Output directory has bad status. Error code " + error.code);
				}
				fs.mkdir(path.resolve(param.output), (err: any) => {
					if (err) {
						reject("Create " + param.output + " directory failed.");
					}
					promiseTransfer(param)
						.then(() => resolve())
						.catch((err: any) => reject(err));
				});
			} else if (stat) {
				if (!stat.isDirectory()) {
					reject(param.output + " is not directory.");
				}
				if (!param.force) {
					reject("The output directory " + param.output + " already exists. Cannot overwrite without force option.");
				}
				promiseTransfer(param)
					.then(() => resolve())
					.catch((err: any) => reject(err));
			}
		});
	})
	.then(restoreDirectory)
	.catch((error) => {
		param.logger.error(error);
		restoreDirectory();
		throw new Error(error);
	})
	.then(() => param.logger.info("Done!"));
};

export function exportHTML(param: TransferTemplateParameterObject, cb: (err?: any) => void): void {
	promiseExportHTML(param).then<void>(cb, cb);
}
