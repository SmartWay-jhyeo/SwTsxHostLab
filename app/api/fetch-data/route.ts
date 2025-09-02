import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET() {
  try {
    // 크롤링하려는 웹사이트 URL (예: 뉴스 사이트)
    const url = "https://news.example.com"

    // 웹사이트 데이터 가져오기
    const response = await fetch(url)
    const html = await response.text()

    // cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(html)

    // 원하는 데이터 추출 (예: 뉴스 제목)
    const newsItems = []
    $(".news-title").each((index, element) => {
      newsItems.push({
        title: $(element).text(),
        link: $(element).find("a").attr("href"),
      })
    })

    // 추출한 데이터 반환
    return NextResponse.json({ success: true, data: newsItems })
  } catch (error) {
    console.error("크롤링 오류:", error)
    return NextResponse.json({ success: false, error: "데이터를 가져오는 중 오류가 발생했습니다" }, { status: 500 })
  }
}
