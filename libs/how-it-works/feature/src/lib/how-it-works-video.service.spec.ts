import { NotFoundException } from '@nestjs/common';
import { HowItWorksVideo } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { HowItWorksVideoService } from './how-it-works-video.service';

describe('HowItWorksVideoService', () => {
  let service: HowItWorksVideoService;
  let prisma: {
    howItWorksVideo: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const actor: RequestUser = {
    sub: 'admin-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const video: HowItWorksVideo = {
    id: 'video-1',
    title: 'Getting started',
    description: null,
    videoUrl: 'https://www.youtube.com/watch?v=abc',
    category: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
  } as HowItWorksVideo;

  beforeEach(() => {
    prisma = {
      howItWorksVideo: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new HowItWorksVideoService(prisma as unknown as PrismaService);
  });

  it('lists videos ordered by sortOrder then createdAt', async () => {
    prisma.howItWorksVideo.findMany.mockResolvedValue([video]);

    const result = await service.list();

    expect(prisma.howItWorksVideo.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    expect(result).toEqual([video]);
  });

  it('creates a video attributed to the acting admin, defaulting sortOrder to 0', async () => {
    prisma.howItWorksVideo.create.mockResolvedValue(video);

    await service.create({ title: 'Getting started', videoUrl: video.videoUrl }, actor);

    expect(prisma.howItWorksVideo.create).toHaveBeenCalledWith({
      data: {
        title: 'Getting started',
        description: undefined,
        videoUrl: video.videoUrl,
        category: undefined,
        sortOrder: 0,
        createdBy: 'admin-1',
        updatedBy: 'admin-1',
      },
    });
  });

  it('updates an existing video after confirming it exists', async () => {
    prisma.howItWorksVideo.findUnique.mockResolvedValue(video);
    prisma.howItWorksVideo.update.mockResolvedValue(video);

    await service.update('video-1', { title: 'Updated title' }, actor);

    expect(prisma.howItWorksVideo.findUnique).toHaveBeenCalledWith({ where: { id: 'video-1' } });
    expect(prisma.howItWorksVideo.update).toHaveBeenCalledWith({
      where: { id: 'video-1' },
      data: {
        title: 'Updated title',
        description: undefined,
        videoUrl: undefined,
        category: undefined,
        sortOrder: undefined,
        updatedBy: 'admin-1',
      },
    });
  });

  it('throws NotFoundException when updating a video that does not exist', async () => {
    prisma.howItWorksVideo.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { title: 'x' }, actor)).rejects.toThrow(NotFoundException);
    expect(prisma.howItWorksVideo.update).not.toHaveBeenCalled();
  });

  it('removes an existing video after confirming it exists', async () => {
    prisma.howItWorksVideo.findUnique.mockResolvedValue(video);

    await service.remove('video-1');

    expect(prisma.howItWorksVideo.delete).toHaveBeenCalledWith({ where: { id: 'video-1' } });
  });

  it('throws NotFoundException when removing a video that does not exist', async () => {
    prisma.howItWorksVideo.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    expect(prisma.howItWorksVideo.delete).not.toHaveBeenCalled();
  });
});
