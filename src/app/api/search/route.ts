import { parseCurlCommand } from "@/lib/request-parser";
import { NextRequest, NextResponse } from "next/server";

const fetchPromise = (headers: Headers, body: string) =>
  fetch("https://www.threads.com/graphql/query", {
    headers,
    body,
    method: "POST",
  });

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

  console.log("page info", dataObject?.data?.searchResults?.page_info);
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

  console.log(formDataBody);

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

    while (hasNextPage && currentPage < parseInt(loopCount)) {
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
      currentPage++;

      console.log(
        loopCount,
        nextCursor,
        hasNextPage,
        extractedData.data.map((item: any) => item.postId),
        temporaryResults.map((item) => item.postId)
      );
    }

    return NextResponse.json({
      success: true,
      data: temporaryResults,
      totalResults: temporaryResults.length,
      message: "Search request processed successfully",
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
