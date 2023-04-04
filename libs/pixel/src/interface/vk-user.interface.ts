export interface VkUserAuth {
  embedUrl?: string;
  token?: string;
  login?: string;
  password?: string;
}
export type VkUserAnyAuth =
  | {
      embedUrl: string;
    }
  | {
      token: string;
    }
  | {
      login: string;
      password: string;
    };
