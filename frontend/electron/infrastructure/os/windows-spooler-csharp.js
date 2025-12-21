/**
 * Código C# para impressão RAW via Spooler
 * Versão com Chunking para evitar estouro de buffer em impressoras antigas (Diebold)
 */

const CODIGO_CSHARP_RAW_PRINTER = `using System;
using System.Runtime.InteropServices;
using System.Threading;

public class RawPrinter {
  [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPTStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
  
  [DllImport("winspool.drv")]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  
  [DllImport("winspool.drv")]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
  
  [DllImport("winspool.drv")]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  
  [DllImport("winspool.drv")]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  
  [DllImport("winspool.drv")]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  
  [DllImport("winspool.drv")]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)]
    public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)]
    public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)]
    public string pDataType;
    
    public DOCINFOA(string docName, string dataType) {
      pDocName = docName;
      pOutputFile = null;
      pDataType = dataType;
    }
  }
  
  public static string SendBytesToPrinter(string szPrinterName, byte[] pBytes) {
    IntPtr hPrinter = IntPtr.Zero;
    
    try {
      // 1. Abrir impressora
      if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
        int error = Marshal.GetLastWin32Error();
        return "ERRO:OpenPrinter falhou (" + error + ")";
      }
      
      // 2. Documento RAW
      DOCINFOA di = new DOCINFOA("ESC/POS Document", "RAW");
      
      if (!StartDocPrinter(hPrinter, 1, di)) {
        int error = Marshal.GetLastWin32Error();
        ClosePrinter(hPrinter);
        return "ERRO:StartDoc falhou (" + error + ")";
      }
      
      // 3. Página
      if (!StartPagePrinter(hPrinter)) {
        int error = Marshal.GetLastWin32Error();
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);
        return "ERRO:StartPage falhou (" + error + ")";
      }
      
      // 4. Escrever em CHUNKS (para evitar estouro de buffer)
      // Diebold IM693H tem buffer pequeno (4KB ou 8KB)
      // Enviar 1KB por vez com delay de 50ms
      const int CHUNK_SIZE = 1024; // 1KB
      int offset = 0;
      int totalEscrito = 0;
      
      while (offset < pBytes.Length) {
        int tamanhoAtual = Math.Min(CHUNK_SIZE, pBytes.Length - offset);
        int dwWritten = 0;
        
        IntPtr ptr = Marshal.UnsafeAddrOfPinnedArrayElement(pBytes, offset);
        
        if (!WritePrinter(hPrinter, ptr, tamanhoAtual, out dwWritten)) {
          int error = Marshal.GetLastWin32Error();
          EndPagePrinter(hPrinter);
          EndDocPrinter(hPrinter);
          ClosePrinter(hPrinter);
          return "ERRO:Write falhou no offset " + offset + " (" + error + ")";
        }
        
        totalEscrito += dwWritten;
        offset += tamanhoAtual;
        
        // Delay para dar tempo à impressora processar
        if (offset < pBytes.Length) {
          Thread.Sleep(50); // 50ms
        }
      }
      
      // 5. Fechar página
      if (!EndPagePrinter(hPrinter)) {
        int error = Marshal.GetLastWin32Error();
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);
        return "ERRO:EndPage falhou (" + error + ")";
      }
      
      // 6. Fechar documento
      if (!EndDocPrinter(hPrinter)) {
        int error = Marshal.GetLastWin32Error();
        ClosePrinter(hPrinter);
        return "ERRO:EndDoc falhou (" + error + ")";
      }
      
      // 7. Fechar impressora
      ClosePrinter(hPrinter);
      
      return "SUCESSO: " + totalEscrito + " bytes enviados em chunks";
      
    } catch (Exception ex) {
      if (hPrinter != IntPtr.Zero) {
        ClosePrinter(hPrinter);
      }
      return "ERRO:Exceção: " + ex.Message;
    }
  }
}`;

module.exports = {
  CODIGO_CSHARP_RAW_PRINTER
};
