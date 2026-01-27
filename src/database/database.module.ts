import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
                // Connection events for monitoring
                onConnectionCreate: (connection) => {
                    connection.on('connected', () =>
                        Logger.log('MongoDB connected successfully'),
                    );
                    connection.on('disconnected', () =>
                        Logger.error('MongoDB disconnected'),
                    );
                    connection.on('error', (err) =>
                        Logger.error(`MongoDB connection error: ${err}`),
                    );
                    return connection;
                },
            }),
        }),
    ],
})
export class DatabaseModule { }