import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { HowItWorksVideoController } from './how-it-works-video.controller';
import { HowItWorksVideoService } from './how-it-works-video.service';

describe('HowItWorksVideoController', () => {
  let controller: HowItWorksVideoController;
  let videos: jest.Mocked<HowItWorksVideoService>;

  const actor: RequestUser = {
    sub: 'admin-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    videos = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<HowItWorksVideoService>;

    controller = new HowItWorksVideoController(videos);
  });

  it('delegates list to HowItWorksVideoService.list', () => {
    controller.list();

    expect(videos.list).toHaveBeenCalledWith();
  });

  it('delegates create with the dto and actor', () => {
    const dto = { title: 'Getting started', videoUrl: 'https://www.youtube.com/watch?v=abc' };

    controller.create(dto, actor);

    expect(videos.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates update with the id, dto, and actor', () => {
    const dto = { title: 'Updated title' };

    controller.update('video-1', dto, actor);

    expect(videos.update).toHaveBeenCalledWith('video-1', dto, actor);
  });

  it('delegates remove with the id', () => {
    controller.remove('video-1');

    expect(videos.remove).toHaveBeenCalledWith('video-1');
  });
});
