import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';

@ApiTags('channels')
@ApiSecurity('X-API-Key')
@Controller('sessions/:sessionId/channels')
export class ChannelController {
  constructor(private readonly sessionService: SessionService) {}

  private getEngine(sessionId: string) {
    const engine = this.sessionService.getEngine(sessionId);
    if (!engine) {
      throw new Error('Session is not started');
    }
    return engine;
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscribed channels/newsletters' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'List of subscribed channels',
  })
  @ApiResponse({ status: 400, description: 'Session not ready' })
  async findAll(@Param('sessionId') sessionId: string) {
    const engine = this.getEngine(sessionId);
    return engine.getSubscribedChannels();
  }

  @Get(':channelId')
  @ApiOperation({ summary: 'Get a specific channel by ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiResponse({
    status: 200,
    description: 'Channel details',
  })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async findOne(@Param('sessionId') sessionId: string, @Param('channelId') channelId: string) {
    const engine = this.getEngine(sessionId);
    const channel = await engine.getChannelById(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    return channel;
  }

  @Get(':channelId/messages')
  @ApiOperation({ summary: 'Get messages from a channel' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max messages to return (default 50)' })
  @ApiResponse({
    status: 200,
    description: 'List of channel messages',
  })
  async getMessages(
    @Param('sessionId') sessionId: string,
    @Param('channelId') channelId: string,
    @Query('limit') limit?: string,
  ) {
    const engine = this.getEngine(sessionId);
    return engine.getChannelMessages(channelId, limit ? parseInt(limit, 10) : undefined);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a channel using invite code' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        inviteCode: {
          type: 'string',
          description: 'Channel invite code (from channel link)',
          example: 'ABC123xyz',
        },
      },
      required: ['inviteCode'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully subscribed to channel',
  })
  async subscribe(@Param('sessionId') sessionId: string, @Body() body: { inviteCode: string }) {
    const engine = this.getEngine(sessionId);
    return engine.subscribeToChannel(body.inviteCode);
  }

  @Delete(':channelId')
  @ApiOperation({ summary: 'Unsubscribe from a channel' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'channelId', description: 'Channel ID to unsubscribe from' })
  @ApiResponse({ status: 200, description: 'Successfully unsubscribed from channel' })
  async unsubscribe(@Param('sessionId') sessionId: string, @Param('channelId') channelId: string) {
    const engine = this.getEngine(sessionId);
    await engine.unsubscribeFromChannel(channelId);
    return { success: true };
  }

  @Post(':channelId/messages')
  @ApiOperation({ summary: 'Post a text message to a channel you administer' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string', description: 'Message text', example: 'Hello from the API!' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Message posted to channel' })
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Param('channelId') channelId: string,
    @Body() body: { text: string },
  ) {
    const engine = this.getEngine(sessionId);
    return engine.sendChannelMessage(channelId, body.text);
  }

  @Post(':channelId/messages/media')
  @ApiOperation({ summary: 'Post an image or video to a channel you administer' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['mediaUrl'],
      properties: {
        mediaUrl: { type: 'string', description: 'Public URL of the image or video', example: 'https://example.com/photo.jpg' },
        caption: { type: 'string', description: 'Optional caption text', example: 'Check this out!' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Media posted to channel' })
  async sendMediaMessage(
    @Param('sessionId') sessionId: string,
    @Param('channelId') channelId: string,
    @Body() body: { mediaUrl: string; caption?: string },
  ) {
    const engine = this.getEngine(sessionId);
    return engine.sendChannelMediaMessage(channelId, body.mediaUrl, body.caption);
  }
}
