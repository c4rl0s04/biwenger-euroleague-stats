/** Existing route validation only tests presence. Do not trim, parseInt, or
 * reject malformed IDs: that would change status codes and database behavior.
 * URLSearchParams.get deliberately preserves the first repeated value.
 */
export function readRoundHttpInput(params: URLSearchParams) {
  return {
    roundId: params.get('roundId'),
    userId: params.get('userId'),
    mode: params.get('mode'),
  };
}
