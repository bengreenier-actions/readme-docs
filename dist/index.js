require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __nccwpck_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__nccwpck_require__.r(__webpack_exports__);

var __createBinding = (undefined && undefined.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (undefined && undefined.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (undefined && undefined.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const lib_1 = require("./lib");
/// action.yml name mappings
// allows us to change the yaml without rewriting code
const paramNames = {
    apiKey: 'apiKey',
    version: 'version',
    categorySlug: 'categorySlug',
    titleRegex: 'titleRegex',
    path: 'path',
    additionalJson: 'additionalJson',
    create: 'create',
    overwrite: 'overwrite',
    clear: 'clear'
};
class InputMissingError extends Error {
    constructor(inputName) {
        super(`❌ Missing required input: ${inputName}`);
    }
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // parse the inputs
            const inputs = Object.entries(paramNames).reduce((prev, curr) => {
                const nxt = Object.assign({}, prev);
                const [paramId, inputName] = curr;
                nxt[paramId] = core.getInput(inputName);
                return nxt;
            }, {});
            // check the inputs
            // this assumes that non-required action.yml inputs have default values
            for (const paramId in paramNames) {
                if (!inputs[paramId] ||
                    inputs[paramId].length === 0) {
                    throw new InputMissingError(paramId);
                }
            }
            // execute work
            yield (0, lib_1.processRequest)(inputs);
            core.info('🚀 Complete.');
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
            else if (typeof error === 'object') {
                core.setFailed(`Failed with error: ${JSON.stringify(error)}`);
            }
            else {
                core.setFailed(`Failed with error: ${error}`);
            }
        }
    });
}
process.on('exit', (code) => {
    if (code !== 0) {
        core.setFailed(`Exiting with code: ${code}`);
    }
    else {
        core.info(`Exiting with code: ${code}`);
    }
});
// begin - actions entrypoint
// eslint-disable-next-line github/no-then
run().catch(error => core.setFailed(`Failed with error: ${error}`));

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map