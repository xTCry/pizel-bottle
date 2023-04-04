import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

@Exclude()
export class SetTemplateFieldDto {
  @Expose({ name: 'url' })
  @IsString()
  @IsOptional()
  public readonly urlToImage: string;
}
