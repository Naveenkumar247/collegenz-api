import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    @InjectConnection() private connection: Connection // Inject raw connection state
  ) {}

  // 🟢 NEW: Direct public diagnostic route to verify connection health
  @Get('db-status')
  async checkDatabaseStatus() {
    try {
      const db = this.connection.db;
      
      // 1. Fetch active database name
      const dbName = db.databaseName;
      
      // 2. Fetch all actual collection folder names present in this namespace
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      // 3. Count documents inside your specific target folder to verify data density
      let usersDocCount = 0;
      if (collectionNames.includes('users')) {
        usersDocCount = await db.collection('users').countDocuments();
      }

      return {
        backendConnectedState: 'CONNECTED_SUCCESSFULLY',
        activeDatabaseNameInUse: dbName,
        collectionsFoundOnThisCluster: collectionNames,
        totalDocumentsInsideUsersCollection: usersDocCount,
        hostUriMasked: 'Verified Cluster Connection Active',
      };
    } catch (error: any) {
      return {
        backendConnectedState: 'CONNECTION_FAILED_OR_MISCONFIGURED',
        errorMessage: error.message,
      };
    }
  }

  @Get('feed')
  async getFeed(@Query('type') type: string, @Query('page') page: string, @Req() req: any) {
    const pageNum = parseInt(page, 10) || 1;
    return this.postsService.getFeed(type || 'recent', req?.user?.sub || '', pageNum);
  }
}
