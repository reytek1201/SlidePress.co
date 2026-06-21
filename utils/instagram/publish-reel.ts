import {
  fetchInstagramMediaPermalink,
  fetchInstagramPageAccessToken,
  graphPost,
  publishInstagramMediaContainer,
  waitForInstagramContainerReady,
} from "@/utils/instagram/graph-api";

export { InstagramPublishScopeError } from "@/utils/instagram/graph-api";

async function createInstagramReelContainer(input: {
  instagramUserId: string;
  pageAccessToken: string;
  videoUrl: string;
  caption: string;
}): Promise<string> {
  const data = await graphPost<{ id?: string }>(
    `${input.instagramUserId}/media`,
    input.pageAccessToken,
    {
      media_type: "REELS",
      video_url: input.videoUrl,
      caption: input.caption,
    },
  );

  if (!data.id) {
    throw new Error("Instagram did not return a media container id");
  }

  return data.id;
}

export interface InstagramReelPublishResult {
  mediaId: string;
  permalink: string;
}

export async function publishInstagramReel(input: {
  userAccessToken: string;
  instagramUserId: string;
  pageId: string;
  videoUrl: string;
  caption: string;
}): Promise<InstagramReelPublishResult> {
  const pageAccessToken = await fetchInstagramPageAccessToken(
    input.userAccessToken,
    input.pageId,
  );

  const containerId = await createInstagramReelContainer({
    instagramUserId: input.instagramUserId,
    pageAccessToken,
    videoUrl: input.videoUrl,
    caption: input.caption,
  });

  await waitForInstagramContainerReady(containerId, pageAccessToken);

  const mediaId = await publishInstagramMediaContainer({
    instagramUserId: input.instagramUserId,
    pageAccessToken,
    containerId,
  });

  const permalink = await fetchInstagramMediaPermalink(mediaId, pageAccessToken);

  return {
    mediaId,
    permalink,
  };
}
