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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = exports.createResolvers = void 0;
const modelResolvers_1 = require("./modelResolvers");
const deviceResolvers_1 = require("./deviceResolvers");
const faultResolvers_1 = require("./faultResolvers");
const predictionResolvers_1 = require("./predictionResolvers");
const notificationResolvers_1 = require("./notificationResolvers");
const dashboardResolvers_1 = require("./dashboardResolvers");
const graphql_scalars_1 = require("graphql-scalars");
let GraphQLUpload;
const createResolvers = async () => {
    if (!GraphQLUpload) {
        const graphqlUploadModule = await Promise.resolve().then(() => __importStar(require('graphql-upload/GraphQLUpload.mjs')));
        GraphQLUpload = graphqlUploadModule.default;
    }
    return {
        DateTime: graphql_scalars_1.GraphQLDateTime,
        JSON: graphql_scalars_1.GraphQLJSON,
        Upload: GraphQLUpload,
        Query: {
            ...modelResolvers_1.modelResolvers.Query,
            ...deviceResolvers_1.deviceResolvers.Query,
            ...faultResolvers_1.faultResolvers.Query,
            ...predictionResolvers_1.predictionResolvers.Query,
            ...notificationResolvers_1.notificationResolvers.Query,
            ...dashboardResolvers_1.dashboardResolvers.Query
        },
        Mutation: {
            ...modelResolvers_1.modelResolvers.Mutation,
            ...deviceResolvers_1.deviceResolvers.Mutation,
            ...faultResolvers_1.faultResolvers.Mutation,
            ...predictionResolvers_1.predictionResolvers.Mutation,
            ...notificationResolvers_1.notificationResolvers.Mutation
        },
        Subscription: {
            ...deviceResolvers_1.deviceResolvers.Subscription,
            ...faultResolvers_1.faultResolvers.Subscription,
            ...notificationResolvers_1.notificationResolvers.Subscription,
            ...dashboardResolvers_1.dashboardResolvers.Subscription
        }
    };
};
exports.createResolvers = createResolvers;
exports.resolvers = (0, exports.createResolvers)();
//# sourceMappingURL=index.js.map