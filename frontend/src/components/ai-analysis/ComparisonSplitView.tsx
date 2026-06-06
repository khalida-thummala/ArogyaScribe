import React, {
  useState,
  useEffect
} from 'react'

import {
  Clock,
  AlertTriangle,
  ArrowLeft,
  Activity
} from 'lucide-react'

import { apiClient, API_BASE_URL } from '@/api/client'

interface ComparisonSplitViewProps {
  patientId: string
  currentFile?: File | null
  currentImageUrl?: string
  currentMetadata?: any
}

export const ComparisonSplitView: React.FC<
  ComparisonSplitViewProps
> = ({
  patientId
}) => {

  const [history, setHistory] =
    useState<any[]>([])

  const [
    selectedHistoricalScan,
    setSelectedHistoricalScan
  ] = useState<any | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {

    const fetchHistory = async () => {

      try {

        console.log(
          "FETCHING HISTORY FOR:",
          patientId
        )

        setLoading(true)

        const res = await apiClient.get(
          `/radiology/patient-radiology-history/${patientId}`
        )

        console.log(
          "HISTORY RESPONSE:",
          res.data
        )

        if (
          res.data &&
          res.data.history
        ) {

          setHistory(
            res.data.history
          )
        }

      } catch (err) {

        console.error(
          "Failed to fetch radiology history:",
          err
        )

      } finally {

        setLoading(false)
      }
    }

    if (patientId) {

      fetchHistory()
    }

  }, [patientId])

  return (

    <div
      className="
        flex
        flex-col
        h-full
        bg-slate-900/50
        rounded-xl
        border
        border-slate-800/60
        shadow-xl
        overflow-hidden
        p-4
      "
    >

      {/* Header */}

      <div
        className="
          flex
          items-center
          gap-2
          mb-4
        "
      >

        <Clock
          className="
            w-5
            h-5
            text-emerald-400
          "
        />

        <h3
          className="
            text-slate-200
            font-semibold
            text-sm
            uppercase
            tracking-wide
          "
        >
          Historical Studies
        </h3>

      </div>

      {/* Selected Study */}

      {selectedHistoricalScan ? (

        <div
          className="
            flex
            flex-col
            flex-1
            min-h-0
            gap-4
          "
        >

          {/* Back Button */}

          <button
            onClick={() =>
              setSelectedHistoricalScan(
                null
              )
            }

            className="
              flex
              items-center
              gap-2
              text-sm
              text-indigo-400
              hover:text-indigo-300
              mb-1
            "
          >

            <ArrowLeft
              className="w-4 h-4"
            />

            Back to Timeline

          </button>

          {/* Full Image */}

          <div
            className="
              bg-black
              rounded-xl
              overflow-hidden
              border
              border-slate-700
              h-[320px]
              flex
              items-center
              justify-center
              shrink-0
            "
          >

            <img
              src={
                selectedHistoricalScan.image_url.toLowerCase().includes('.dcm')
                  ? `${API_BASE_URL}/radiology/image/${selectedHistoricalScan.report_id}`
                  : selectedHistoricalScan.image_url
              }

              alt="Historical Scan"

              className="
                w-full
                h-full
                object-contain
              "
            />

          </div>

          {/* Findings */}

          <div
            className="
              flex-1
              bg-slate-800/40
              rounded-xl
              border
              border-slate-700
              p-4
              overflow-y-auto
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                mb-4
                pb-2
                border-b
                border-slate-700
              "
            >

              <h4
                className="
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                AI Radiology Findings
              </h4>

              <span
                className="
                  px-2
                  py-1
                  rounded
                  bg-indigo-500/20
                  text-indigo-300
                  text-xs
                  font-medium
                "
              >
                {
                  selectedHistoricalScan.modality ||
                  "XR"
                }
              </span>

            </div>

            <div className="space-y-5">

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wider
                    text-slate-500
                    mb-2
                  "
                >
                  Impression
                </p>

                <p
                  className="
                    text-sm
                    text-slate-200
                    leading-relaxed
                  "
                >
                  {
                    selectedHistoricalScan.impression
                  }
                </p>

              </div>

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wider
                    text-slate-500
                    mb-2
                  "
                >
                  Findings
                </p>

                <p
                  className="
                    text-sm
                    text-slate-300
                    leading-relaxed
                  "
                >
                  {
                    selectedHistoricalScan.findings
                  }
                </p>

              </div>

              {((selectedHistoricalScan.snomed_codes && selectedHistoricalScan.snomed_codes.length > 0) || 
                (selectedHistoricalScan.loinc_codes && selectedHistoricalScan.loinc_codes.length > 0)) && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                    <Activity size={12} /> Clinical Codes
                  </p>
                  <div className="flex flex-col gap-2">
                    {selectedHistoricalScan.snomed_codes?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1 mt-1">SNOMED:</span>
                        {selectedHistoricalScan.snomed_codes.map((c: any, i: number) => (
                          <span key={i} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                            {c.code}: {c.term}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedHistoricalScan.loinc_codes?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1 mt-1">LOINC:</span>
                        {selectedHistoricalScan.loinc_codes.map((c: any, i: number) => (
                          <span key={i} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                            {c.code}: {c.term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedHistoricalScan.comparison && (

                <div>

                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-slate-500
                      mb-2
                    "
                  >
                    Comparison
                  </p>

                  <p
                    className="
                      text-sm
                      text-slate-300
                      leading-relaxed
                    "
                  >
                    {
                      selectedHistoricalScan.comparison
                    }
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      ) : (

        <div
          className="
            flex-1
            overflow-y-auto
            pr-1
          "
        >

          {loading ? (

            <div
              className="
                flex
                items-center
                justify-center
                h-full
              "
            >

              <div
                className="
                  animate-spin
                  rounded-full
                  h-10
                  w-10
                  border-t-2
                  border-b-2
                  border-indigo-500
                "
              />

            </div>

          ) : history.length === 0 ? (

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                text-center
                h-full
              "
            >

              <AlertTriangle
                className="
                  w-12
                  h-12
                  text-slate-600
                  mb-3
                "
              />

              <h4
                className="
                  text-slate-300
                  font-medium
                "
              >
                No Historical Studies
              </h4>

              <p
                className="
                  text-slate-500
                  text-sm
                  mt-2
                "
              >
                This patient has no
                prior radiology scans.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                grid-cols-1
                gap-4
              "
            >

              {history.map((scan) => (

                <button
                  key={scan.report_id}

                  onClick={() =>
                    setSelectedHistoricalScan(
                      scan
                    )
                  }

                  className="
                    w-full
                    rounded-xl
                    overflow-hidden
                    border
                    border-slate-700
                    bg-slate-900/40
                    hover:border-indigo-500
                    hover:scale-[1.01]
                    transition-all
                    text-left
                  "
                >

                  {/* Thumbnail */}

                  <div
                    className="
                      h-44
                      bg-black
                      flex
                      items-center
                      justify-center
                      overflow-hidden
                    "
                  >

                    <img
                      src={
                        scan.thumbnail_url || (
                          scan.image_url?.toLowerCase().includes('.dcm')
                            ? `${API_BASE_URL}/radiology/image/${scan.report_id}`
                            : scan.image_url
                        )
                      }
                      alt="thumbnail"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />

                  </div>

                  {/* Study Info */}

                  <div className="p-4">

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        mb-3
                      "
                    >

                      <span
                        className="
                          px-2
                          py-1
                          rounded
                          bg-indigo-500/20
                          text-indigo-300
                          text-xs
                          font-medium
                        "
                      >
                        {
                          scan.modality ||
                          "XR"
                        }
                      </span>

                      <span
                        className="
                          text-xs
                          text-slate-400
                        "
                      >
                        {
                          scan.study_date ||
                          scan.created_at?.split(" ")[0]
                        }
                      </span>

                    </div>

                    <p
                      className="
                        text-sm
                        text-slate-200
                        line-clamp-2
                        leading-relaxed
                      "
                    >
                      {
                        scan.impression ||
                        "No impression available."
                      }
                    </p>

                  </div>

                </button>

              ))}

            </div>

          )}

        </div>

      )}

    </div>
  )
}