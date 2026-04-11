type PrivacyPolicyProps = {
  open: boolean
  onClose: () => void
}

export default function PrivacyPolicy({ open, onClose }: PrivacyPolicyProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>隱私權政策</h2>
          <button className="modal-close" onClick={onClose} aria-label="關閉">
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          <section>
            <h3>1. 我們蒐集哪些資料</h3>
            <p>
              StockPilot 為無需註冊的開放工具，<strong>不主動蒐集個人身份識別資料</strong>
              （姓名、電話、身分證字號等）。您在工具中輸入的股票代碼、回測參數、ETF 試算參數等
              僅用於即時計算，計算結果透過瀏覽器顯示後，不會與您的身份綁定儲存於本站伺服器。
            </p>
          </section>

          <section>
            <h3>2. 自動蒐集的技術資訊</h3>
            <p>
              基於網站營運與安全需要，伺服器日誌可能暫時記錄 IP 位址、瀏覽器類型、作業系統、
              造訪時間、存取頁面等非個人識別資訊。這些資料僅用於<strong>流量統計、錯誤排查與防禦濫用</strong>，
              不會被用於個人追蹤或與第三方交換。
            </p>
          </section>

          <section>
            <h3>3. Cookie 與第三方廣告</h3>
            <p>
              本站使用 localStorage 儲存您的主題偏好（深色/淺色）與免責聲明同意狀態，僅存於您的裝置。
              本站亦顯示 Google AdSense 等第三方廣告，第三方可能透過 Cookie 蒐集您的瀏覽行為以投放
              個人化廣告。您可於
              {' '}<a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google 廣告設定</a>{' '}
              關閉個人化廣告，或參考
              {' '}<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google 廣告政策</a>
              。
            </p>
          </section>

          <section>
            <h3>4. 第三方服務</h3>
            <p>
              股價資料來源為 Yahoo Finance，當您使用查詢與回測功能時，您的請求參數（如股票代碼）
              會送至 Yahoo Finance 以取得資料，並遵循其隱私政策。本站與 Yahoo 無合作關係，
              亦無法保證其資料之即時性與正確性。
            </p>
          </section>

          <section>
            <h3>5. 個人資料保護法權利</h3>
            <p>
              依《個人資料保護法》第 3 條，就本站所保有之您的個人資料，您得行使下列權利：
              查詢或請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集處理或利用、請求刪除。
              由於本站未儲存可識別的個人資料，如您對伺服器日誌或其他技術資料有疑慮，
              可透過下方聯絡方式與我們聯繫。
            </p>
          </section>

          <section>
            <h3>6. 兒童隱私</h3>
            <p>
              本站不針對 13 歲以下兒童設計內容，亦不刻意蒐集其個人資料。
              若您是未成年人，請在監護人同意下使用本站。
            </p>
          </section>

          <section>
            <h3>7. 資料保留與安全</h3>
            <p>
              伺服器日誌保留期間原則上不超過 30 天，屆滿後即行刪除或去識別化。
              本站採用 HTTPS 加密傳輸，並定期更新依賴套件以降低安全風險，
              但無法保證網路傳輸過程絕對安全，使用者應自行留意上網環境。
            </p>
          </section>

          <section>
            <h3>8. 政策變更</h3>
            <p>
              本隱私權政策如有修改，將公布於本頁面並更新下方「最後更新日期」。
              重大變更時將透過網站公告，繼續使用本站即視為同意修改後之條款。
            </p>
          </section>

          <section>
            <h3>9. 聯絡方式</h3>
            <p>
              如對本隱私權政策或您的個人資料有任何疑問，可透過電子郵件聯繫：
              {' '}<a href="mailto:contact@stockpilot.example">contact@stockpilot.example</a>
            </p>
          </section>

          <p className="modal-footer-note">
            最後更新日期：2026-04-11
          </p>
        </div>
      </div>
    </div>
  )
}
