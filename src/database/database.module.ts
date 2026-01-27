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
                    const logger = new Logger();

                    connection.on('connected', () =>
                        logger.log('MongoDB connected successfully', 'DatabaseModule'),
                    );
                    connection.on('disconnected', () =>
                        logger.error('MongoDB disconnected', 'DatabaseModule'),
                    );
                    connection.on('error', (err) =>
                        logger.error(`MongoDB connection error: ${err}`, 'DatabaseModule'),
                    );
                    return connection;
                },
            }),
        }),
    ],
})
export class DatabaseModule { }