import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import subscriptionService from '../core/services/subscription.service.js';
import Logger from '../core/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, 'subscription.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const subscriptionProto = grpc.loadPackageDefinition(packageDefinition).subscription;

const server = new grpc.Server();

server.addService(subscriptionProto.SubscriptionService.service, {
  Subscribe: async (call, callback) => {
    try {
      const { email, repo } = call.request;
      const result = await subscriptionService.subscribe(email, repo);
      callback(null, result);
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  Confirm: async (call, callback) => {
    try {
      const { token } = call.request;
      const result = await subscriptionService.confirm(token);
      callback(null, result);
    } catch (error) {
      callback({ code: grpc.status.NOT_FOUND, message: error.message });
    }
  },

  Unsubscribe: async (call, callback) => {
    try {
      const { token } = call.request;
      const result = await subscriptionService.unsubscribe(token);
      callback(null, result);
    } catch (error) {
      callback({ code: grpc.status.NOT_FOUND, message: error.message });
    }
  },

  GetSubscriptions: async (call, callback) => {
    try {
      const { email } = call.request;
      const subscriptions = await subscriptionService.getAllByEmail(email);
      callback(null, { subscriptions });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
});

export const startGrpcServer = () => {
  const address = `0.0.0.0:${process.env.GRPC_PORT || 50051}`;
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, _port) => {
    if (error) {
      Logger.error('gRPC-Server', `Failed to bind: ${error.message}`);
      return;
    }
    Logger.log('gRPC-Server', `gRPC Server running on ${address}`);
  });
};

if (process.argv[1] === __filename) {
  startGrpcServer();
}
