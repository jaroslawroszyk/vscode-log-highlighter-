import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel;

export function initLogger(): void {
	outputChannel = vscode.window.createOutputChannel("log-highlighter");
	outputChannel.show(true);
}

export function log(msg: string): void {
	outputChannel?.appendLine(msg);
}

export function info(msg: string): void {
	outputChannel?.appendLine(`[INFO] ${msg}`);
}

export function warn(msg: string): void {
	outputChannel?.appendLine(`[WARN] ${msg}`);
}

export function err(msg: string): void {
	outputChannel?.appendLine(`[ERROR] ${msg}`);
}

export function disposeLogger(): void {
	outputChannel?.dispose();
}
