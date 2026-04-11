type DisclaimerProps = {
  open: boolean
  onClose: () => void
  mustAcknowledge?: boolean
}

export default function Disclaimer({ open, onClose, mustAcknowledge = false }: DisclaimerProps) {
  if (!open) return null

  const handleOverlayClick = () => {
    if (!mustAcknowledge) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mustAcknowledge ? '歡迎使用 StockPilot — 請先閱讀' : '免責聲明與使用條款'}</h2>
          {!mustAcknowledge && (
            <button className="modal-close" onClick={onClose} aria-label="關閉">
              &#10005;
            </button>
          )}
        </div>
        <div className="modal-body">
          <section>
            <h3>1. 非投資建議</h3>
            <p>
              StockPilot 所提供的所有資訊、分析結果、回測數據、樂活五線譜訊號及相關內容，
              <strong>僅供教育、研究與參考用途</strong>，不構成任何形式之投資建議、要約、招攬、
              推薦或保證。本站並非證券投資顧問事業、期貨顧問事業或其他金融服務業。
            </p>
          </section>

          <section>
            <h3>2. 資料來源與準確性</h3>
            <p>
              歷史股價資料來源為 Yahoo Finance，使用調整後收盤價（Adjusted Close）計算，
              已反映股息再投入與股票分割。本站<strong>不保證資料的即時性、完整性或正確性</strong>，
              實際交易價格、手續費、稅負、匯率等因素均未納入回測模型，實際結果將與回測有所差異。
            </p>
          </section>

          <section>
            <h3>3. 過去績效不代表未來表現</h3>
            <p>
              所有回測結果、年化報酬率（XIRR）、策略比較均基於歷史資料，
              <strong>過去績效不保證未來報酬</strong>。金融市場波動劇烈，投資涉及風險，
              可能導致本金全部或部分損失。
            </p>
          </section>

          <section>
            <h3>4. 自行評估與承擔風險</h3>
            <p>
              使用者應<strong>自行評估自身財務狀況、投資目標、風險承受度</strong>，
              並諮詢合格的專業人士（如財務顧問、會計師、律師）後再做投資決策。
              使用者因使用本站資訊所產生之任何直接或間接損失，本站及其開發者概不負責。
            </p>
          </section>

          <section>
            <h3>5. 廣告揭露</h3>
            <p>
              本站顯示來自 Google AdSense 等第三方廣告聯播網的廣告，以維持網站營運。
              廣告內容由第三方提供，本站不對廣告商品或服務之準確性、可靠性負責。
              第三方廣告商可能使用 Cookie 追蹤使用者行為以投放個人化廣告，
              您可參考 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google 廣告政策</a> 了解詳情或選擇退出。
            </p>
          </section>

          <section>
            <h3>6. 智慧財產權</h3>
            <p>
              本站所有內容、程式碼、設計均受著作權法保護。未經授權，不得以任何形式複製、
              散布、修改或用於商業用途。
            </p>
          </section>

          <section>
            <h3>7. 條款變更</h3>
            <p>
              本站保留隨時修改本免責聲明之權利，修改後將公布於本頁面。
              繼續使用本站即視為同意修改後之條款。
            </p>
          </section>

          <p className="modal-footer-note">
            最後更新日期：2026-04-05 · 繼續使用本站即表示您已閱讀並同意上述所有條款。
          </p>

          {mustAcknowledge && (
            <div className="modal-ack-row">
              <button className="modal-ack-btn" onClick={onClose}>
                我已閱讀並同意上述條款
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
