//#region src/invariant.ts
import { readFileSync } from "node:fs";
const PACKAGE_NAME = "dsh-lan-pair";
/** Cordis companion plugin name. */
const name = "lan-pair-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* The settings namespace is declared once in the host half and read once in the
* browser half. Both are literals in build products, so a rename on either side
* compiles and ships cleanly and then fails silently at runtime: the host serves
* a namespace nobody reads, or the row subscribes to one nobody serves and
* renders empty. Neither failure raises an error, which is exactly the class of
* contract this companion exists to catch.
*/
const SETTINGS_NAMESPACE_CONST = "REMOTE_WEB_UI_SETTINGS_NAMESPACE";
/** Read one sibling build product as text, or throw with the resolved path. */
function readSibling(file) {
	const url = new URL(file, import.meta.url);
	try {
		return readFileSync(url, "utf8");
	} catch (cause) {
		throw new Error(`cannot read sibling build product ${file} at ${url.pathname}`, { cause });
	}
}
/** Extract the namespace literal the host half exports, or undefined when absent. */
function declaredNamespace(source) {
	const prefix = `const ${SETTINGS_NAMESPACE_CONST} = `;
	const at = source.indexOf(prefix);
	if (at === -1) return void 0;
	const match = /^"([^"]+)"/.exec(source.slice(at + prefix.length));
	return match === null ? void 0 : match[1];
}
/**
* Assert that the namespace the host half declares is the one the browser half
* subscribes to, and that both halves are actually present in the package.
* @param _ctx - child context; this check needs no services.
* @param fail - invariant failure reporter for this package.
*/
const install = (_ctx, fail) => {
	const host = readSibling("./index.js");
	const client = readSibling("./client.js");
	const declared = declaredNamespace(host);
	if (declared === void 0) {
		fail(`the host half no longer declares ${SETTINGS_NAMESPACE_CONST}; the browser half's settings row would subscribe to an unserved namespace`);
		return;
	}
	if (!client.includes(`"${declared}"`)) fail(`the host half serves settings namespace "${declared}" but the browser half never names it — the settings card would render empty`);
};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
