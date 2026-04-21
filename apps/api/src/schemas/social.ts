import { Type } from "@sinclair/typebox";

export const SocialFollowingParamsSchema = Type.Object({
  userId: Type.String({ minLength: 1 }),
});

export const SocialFollowingMutationResultSchema = Type.Object({
  following: Type.Boolean(),
  isFriend: Type.Boolean(),
});
