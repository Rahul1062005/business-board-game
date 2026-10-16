"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_UTILITY_SPACES = exports.ALL_TRANSIT_SPACES = exports.SPACES_BY_CATEGORY = exports.SPACES_BY_INDEX = exports.SPACES_BY_ID = void 0;
__exportStar(require("./boardData.js"), exports);
__exportStar(require("./cardsData.js"), exports);
const boardData_js_1 = require("./boardData.js");
exports.SPACES_BY_ID = new Map(boardData_js_1.BOARD_SPACES.map((space) => [space.id, space]));
exports.SPACES_BY_INDEX = new Map(boardData_js_1.BOARD_SPACES.map((space) => [space.index, space]));
exports.SPACES_BY_CATEGORY = boardData_js_1.BOARD_SPACES.reduce((acc, space) => {
    if (space.category) {
        if (!acc[space.category])
            acc[space.category] = [];
        acc[space.category].push(space);
    }
    return acc;
}, {});
exports.ALL_TRANSIT_SPACES = boardData_js_1.BOARD_SPACES.filter((s) => s.type === 'transit');
exports.ALL_UTILITY_SPACES = boardData_js_1.BOARD_SPACES.filter((s) => s.type === 'utility');
