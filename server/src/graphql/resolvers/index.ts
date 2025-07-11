import { modelResolvers } from './modelResolvers';
import { deviceResolvers } from './deviceResolvers';
import { faultResolvers } from './faultResolvers';
import { predictionResolvers } from './predictionResolvers';
import { notificationResolvers } from './notificationResolvers';
import { dashboardResolvers } from './dashboardResolvers';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';

// Dynamic import for GraphQLUpload to handle ESM module in CommonJS environment
let GraphQLUpload: any;

export const createResolvers = async () => {
  // Dynamically import GraphQLUpload
  if (!GraphQLUpload) {
    try {
      const graphqlUploadModule = await import('graphql-upload');
      GraphQLUpload = (graphqlUploadModule as any).GraphQLUpload || graphqlUploadModule.default;
    } catch (error) {
      console.warn('GraphQLUpload not available, file uploads will be disabled');
      GraphQLUpload = null;
    }
  }

  return {
    DateTime: GraphQLDateTime,
    JSON: GraphQLJSON,
    Upload: GraphQLUpload,

    Query: {
      ...modelResolvers.Query,
      ...deviceResolvers.Query,
      ...faultResolvers.Query,
      ...predictionResolvers.Query,
      ...notificationResolvers.Query,
      ...dashboardResolvers.Query
    },

    Mutation: {
      ...modelResolvers.Mutation,
      ...deviceResolvers.Mutation,
      ...faultResolvers.Mutation,
      ...predictionResolvers.Mutation,
      ...notificationResolvers.Mutation
    },

    Subscription: {
      ...deviceResolvers.Subscription,
      ...faultResolvers.Subscription,
      ...notificationResolvers.Subscription,
      ...dashboardResolvers.Subscription
    }
  };
};

// For backward compatibility, export a promise that resolves to the resolvers
export const resolvers = createResolvers();