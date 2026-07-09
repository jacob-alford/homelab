{ inputs, ... }:
{
  flake.modules.nixos.cicero-observability = {
    imports = with inputs.self.modules.nixos; [
      cicero-observability-acme
      cicero-observability-caddy
      cicero-observability-node-exporter
      cicero-observability-alloy
    ];
  };
}
