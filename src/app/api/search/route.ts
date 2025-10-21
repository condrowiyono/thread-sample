import { parseCurlCommand } from "@/lib/request-parser";
import { NextRequest, NextResponse } from "next/server";

const fetchPromise = async (headers: Headers, body: string) => {
  try {
    const response = await fetch("https://www.threads.com/graphql/query", {
      headers,
      body,
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const extractData = (dataObject: any) => {
  const searchResults = dataObject?.data?.searchResults?.edges || [];
  const simplifiedSearchResults = searchResults
    .map((edge: any) => {
      const threadItems = edge?.node?.thread?.thread_items || [];
      return threadItems.map((item: any) => {
        const post = item?.post;
        const username = post?.user?.username || null;
        return {
          username,
          caption: post?.text_post_app_info?.text_fragments?.fragments
            ?.map((frag: any) => frag.plaintext)
            .join(" "),
          postId: post?.pk,
          userId: post?.user?.pk,
        };
      });
    })
    .flat();

  return {
    data: simplifiedSearchResults,
    totalResults: simplifiedSearchResults.length,
    nextCursor: dataObject?.data?.searchResults?.page_info?.end_cursor || null,
    hasNextPage:
      dataObject?.data?.searchResults?.page_info?.has_next_page || false,
    message: "Search request processed successfully",
  };
};

async function fetchData(options: {
  query: string;
  nextCursor: string | null;
  pageSize: number;
  headers: Headers;
  body: string;
}) {
  const { query, nextCursor, pageSize, headers, body } = options;
  const formDataBody = new URLSearchParams(body);
  const variables = formDataBody.get("variables");
  const variablesObject = JSON.parse(variables ?? "{}");

  variablesObject.after = nextCursor;
  variablesObject.before = null;
  variablesObject.first = pageSize;
  variablesObject.query = query;

  const variablesString = JSON.stringify(variablesObject);
  formDataBody.set("variables", variablesString);

  const data = await fetchPromise(headers, formDataBody.toString());
  const dataObject = await data.json();

  // format the dataObject
  return extractData(dataObject);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { query, pageSize, loopCount, curlCommand } = body;

    const { headers: parsedHeaders, body: parsedBody } =
      parseCurlCommand(curlCommand);

    let temporaryResults: any[] = [];
    let nextCursor = null;
    let hasNextPage = true;
    let currentPage = 0;
    let errors: Array<{ page: number; error: string }> = [];
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;

    while (hasNextPage && currentPage < parseInt(loopCount)) {
      try {
        const extractedData = await fetchData({
          query,
          nextCursor,
          pageSize,
          body: parsedBody,
          headers: parsedHeaders,
        });

        temporaryResults = [...temporaryResults, ...extractedData.data];
        nextCursor = extractedData.nextCursor;
        hasNextPage = extractedData.hasNextPage;
        consecutiveErrors = 0;

        console.log(
          `Page ${currentPage + 1}: Fetched ${
            extractedData.data.length
          } items. Total: ${temporaryResults.length}`
        );
      } catch (error) {
        consecutiveErrors++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({
          page: currentPage + 1,
          error: errorMessage,
        });

        console.error(`Error fetching page ${currentPage + 1}:`, errorMessage);

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(
            `Stopping after ${MAX_CONSECUTIVE_ERRORS} consecutive errors`
          );
          break;
        }

        if (!nextCursor) {
          console.log("No cursor available, stopping loop");
          hasNextPage = false;
        }
      }

      currentPage++;
    }

    return NextResponse.json({
      success: true,
      data: temporaryResults,
      totalResults: temporaryResults.length,
      pagesProcessed: currentPage,
      errors: errors.length > 0 ? errors : undefined,
      message:
        errors.length > 0
          ? `Search completed with ${errors.length} error(s). Retrieved ${temporaryResults.length} results.`
          : "Search request processed successfully",
    });
  } catch (error) {
    console.error("Error processing search request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 }
    );
  }
}
