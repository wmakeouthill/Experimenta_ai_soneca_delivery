/**
 * Detector de Impressoras - Linux
 * Responsabilidade: Listar impressoras no Linux usando lpstat
 */

const { executarComando } = require('../../../utils/exec-utils');

/**
 * Lista impressoras no Linux usando lpstat
 * @returns {Promise<Array<{name: string, devicePath: string, status: string, padrao: boolean, tipo: string}>>}
 */
async function listarImpressorasLinux() {
  try {
    const { stdout } = await executarComando('lpstat -p -d', { timeout: 5000 });
    const linhas = stdout.split('\n').filter(l => l.trim());
    const impressoras = [];
    let impressoraPadrao = '';

    const padraoMatch = stdout.match(/system default destination:\s*(.+)/);
    if (padraoMatch) {
      impressoraPadrao = padraoMatch[1].trim();
    }

    for (const linha of linhas) {
      const match = linha.match(/printer\s+(\S+)/);
      if (match) {
        const nome = match[1];
        impressoras.push({
          name: nome,
          devicePath: `/dev/usb/lp${impressoras.length}`,
          status: linha.includes('idle') ? 'Disponível' : 'Desconhecido',
          padrao: nome === impressoraPadrao,
          tipo: 'linux'
        });
      }
    }

    // Tenta também listar dispositivos USB diretos
    try {
      const { stdout: usbOut } = await executarComando('ls -la /dev/usb/lp* 2>/dev/null || true', { timeout: 3000 });
      if (usbOut.trim()) {
        const usbDevices = usbOut.trim().split('\n');
        usbDevices.forEach(device => {
          const match = device.match(/lp(\d+)/);
          if (match) {
            impressoras.push({
              name: `USB Printer ${match[1]}`,
              devicePath: `/dev/usb/lp${match[1]}`,
              status: 'Disponível',
              padrao: false,
              tipo: 'linux-usb'
            });
          }
        });
      }
    } catch {
      // Ignora erros de USB
    }

    return impressoras;
  } catch (error) {
    console.error('❌ Erro ao listar impressoras Linux:', error);
    return [];
  }
}

module.exports = {
  listarImpressorasLinux
};

