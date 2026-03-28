export interface HomeDiscoveryResult<TTitleSummary> {
  upcoming: TTitleSummary[];
  latest: TTitleSummary[];
  popular: TTitleSummary[];
}
