import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** Pause/resume only - see GlRecurringJournalEntry's own doc comment for
 * why amounts/lines are never editable in place. */
export class UpdateRecurringJournalEntryDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}
