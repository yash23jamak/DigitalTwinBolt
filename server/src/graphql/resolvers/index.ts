import { modelResolvers } from './modelResolvers';
import { deviceResolvers } from './deviceResolvers';
import { faultResolvers } from './faultResolvers';
import { predictionResolvers } from './predictionResolvers';
import { notificationResolvers } from './notificationResolvers';
import { dashboardResolvers } from './dashboardResolvers';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

export const resolvers = {
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