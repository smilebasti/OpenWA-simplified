import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto, SessionResponseDto, QRCodeResponseDto } from './dto';
import { Session } from './entities/session.entity';
import { RequireRole } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';

@ApiTags('sessions')
@ApiSecurity('X-API-Key')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  private transformSession(session: Session): SessionResponseDto {
    return {
      id: session.id,
      name: session.name,
      status: session.status,
      phone: session.phone,
      pushName: session.pushName,
      connectedAt: session.connectedAt,
      lastActive: session.lastActiveAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  @Post()
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new WhatsApp session' })
  @ApiResponse({ status: 201, description: 'Session created', type: SessionResponseDto })
  @ApiResponse({ status: 409, description: 'Session name already exists' })
  async create(@Body() dto: CreateSessionDto): Promise<Session> {
    return this.sessionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all sessions' })
  @ApiResponse({ status: 200, description: 'List of sessions', type: [SessionResponseDto] })
  async findAll(): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionService.findAll();
    return sessions.map(s => this.transformSession(s));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session details', type: SessionResponseDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(@Param('id') id: string): Promise<SessionResponseDto> {
    const session = await this.sessionService.findOne(id);
    return this.transformSession(session);
  }

  @Delete(':id')
  @RequireRole(ApiKeyRole.OPERATOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.sessionService.delete(id);
  }

  @Post(':id/start')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Start a session and initialize WhatsApp connection' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session started', type: SessionResponseDto })
  @ApiResponse({ status: 400, description: 'Session already started' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async start(@Param('id') id: string): Promise<SessionResponseDto> {
    const session = await this.sessionService.start(id);
    return this.transformSession(session);
  }

  @Post(':id/stop')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Stop a session and disconnect WhatsApp' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session stopped', type: SessionResponseDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async stop(@Param('id') id: string): Promise<SessionResponseDto> {
    const session = await this.sessionService.stop(id);
    return this.transformSession(session);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for session authentication' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'QR code data', type: QRCodeResponseDto })
  @ApiResponse({ status: 400, description: 'QR code not ready or session already authenticated' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getQRCode(@Param('id') id: string): Promise<QRCodeResponseDto> {
    return this.sessionService.getQRCode(id);
  }

  @Get(':id/groups')
  @ApiOperation({ summary: 'Get all groups for a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'List of groups' })
  @ApiResponse({ status: 400, description: 'Session not ready' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getGroups(@Param('id') id: string): Promise<{ id: string; name: string }[]> {
    return this.sessionService.getGroups(id);
  }
}
