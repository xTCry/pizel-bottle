import { Exclude, Expose } from 'class-transformer';
import { Length, IsString, IsArray, ArrayMinSize } from 'class-validator';

@Exclude()
export class AddWarriorDto {
  @Expose({ name: 'embed_url' })
  @IsString()
  @Length(128, 512)
  public readonly embedUrl: string;
}

@Exclude()
export class AddWarriorsDto {
  @Expose({ name: 'embed_url' })
  @IsArray()
  @ArrayMinSize(1)
  // @ValidateNested({ each: true })
  // @IsString()
  // @Length(128, 512)
  // @Type(() => AddWarrirDto)
  public readonly embedUrls: string[];
}
