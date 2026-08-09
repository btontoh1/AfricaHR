import { PublicApplicationController } from './public-application.controller';
import { PublicApplicationService } from './public-application.service';

describe('PublicApplicationController', () => {
  let controller: PublicApplicationController;
  let service: jest.Mocked<PublicApplicationService>;

  beforeEach(() => {
    service = {
      getOpenRequisition: jest.fn(),
      apply: jest.fn(),
    } as unknown as jest.Mocked<PublicApplicationService>;

    controller = new PublicApplicationController(service);
  });

  it('delegates getOpenRequisition with the requisition id, no tenant or actor involved', () => {
    controller.getOpenRequisition('req-1');

    expect(service.getOpenRequisition).toHaveBeenCalledWith('req-1');
  });

  it('delegates apply with the requisition id and dto, no tenant or actor involved', () => {
    const dto = { firstName: 'Kwame', lastName: 'Mensah', email: 'kwame@example.com' };

    controller.apply('req-1', dto);

    expect(service.apply).toHaveBeenCalledWith('req-1', dto);
  });
});
