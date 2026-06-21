import {
  fetchInstagramMediaPermalink,
  fetchInstagramPageAccessToken,
  graphPost,
  publishInstagramMediaContainer,
  waitForInstagramContainerReady,
} from "@/utils/instagram/graph-api";

export const INSTAGRAM_CAROUSEL_MIN_SLIDES = 2;
export const INSTAGRAM_CAROUSEL_MAX_SLIDES = 10;

async function createInstagramCarouselItemContainer(input: {
  instagramUserId: string;
  pageAccessToken: string;
  imageUrl: string;
}): Promise<string> {
  const data = await graphPost<{ id?: string }>(
    `${input.instagramUserId}/media`,
    input.pageAccessToken,
    {
      image_url: input.imageUrl,
      is_carousel_item: "true",
    },
  );

  if (!data.id) {
    throw new Error("Instagram did not return a carousel item container id");
  }

  return data.id;
}

async function createInstagramCarouselContainer(input: {
  instagramUserId: string;
  pageAccessToken: string;
  childContainerIds: string[];
  caption: string;
}): Promise<string> {
  const data = await graphPost<{ id?: string }>(
    `${input.instagramUserId}/media`,
    input.pageAccessToken,
    {
      media_type: "CAROUSEL",
      children: input.childContainerIds.join(","),
      caption: input.caption,
    },
  );

  if (!data.id) {
    throw new Error("Instagram did not return a carousel container id");
  }

  return data.id;
}

export interface InstagramCarouselPublishResult {
  mediaId: string;
  permalink: string;
}

export async function publishInstagramCarousel(input: {
  userAccessToken: string;
  instagramUserId: string;
  pageId: string;
  imageUrls: string[];
  caption: string;
}): Promise<InstagramCarouselPublishResult> {
  if (input.imageUrls.length < INSTAGRAM_CAROUSEL_MIN_SLIDES) {
    throw new Error(
      `Instagram carousels need at least ${INSTAGRAM_CAROUSEL_MIN_SLIDES} images`,
    );
  }

  if (input.imageUrls.length > INSTAGRAM_CAROUSEL_MAX_SLIDES) {
    throw new Error(
      `Instagram carousels support at most ${INSTAGRAM_CAROUSEL_MAX_SLIDES} images`,
    );
  }

  const pageAccessToken = await fetchInstagramPageAccessToken(
    input.userAccessToken,
    input.pageId,
  );

  const childContainerIds: string[] = [];

  for (const imageUrl of input.imageUrls) {
    const containerId = await createInstagramCarouselItemContainer({
      instagramUserId: input.instagramUserId,
      pageAccessToken,
      imageUrl,
    });
    childContainerIds.push(containerId);
  }

  const carouselContainerId = await createInstagramCarouselContainer({
    instagramUserId: input.instagramUserId,
    pageAccessToken,
    childContainerIds,
    caption: input.caption,
  });

  await waitForInstagramContainerReady(carouselContainerId, pageAccessToken);

  const mediaId = await publishInstagramMediaContainer({
    instagramUserId: input.instagramUserId,
    pageAccessToken,
    containerId: carouselContainerId,
  });

  const permalink = await fetchInstagramMediaPermalink(mediaId, pageAccessToken);

  return {
    mediaId,
    permalink,
  };
}
