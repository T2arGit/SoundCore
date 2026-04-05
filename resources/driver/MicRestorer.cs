using System;
using System.Runtime.InteropServices;

namespace MicRestorer {
    [ComImport, Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IPolicyConfig {
        int a(); int b(); int c(); int d(); int e(); int f(); int g(); int h(); int i(); int j();
        int SetDefaultEndpoint(string pszDeviceName, int role);
        int SetEndpointVisibility(string pszDeviceName, int bVisible);
    }
    
    [ComImport, Guid("294935CE-F5E5-468C-BE63-54B9EDBB9445")]
    class PolicyConfigClient { }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr ppDevices);
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IntPtr ppEndpoint);
        int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string pwstrId, out IntPtr ppDevice);
        int RegisterEndpointNotificationCallback(IntPtr pClient);
        int UnregisterEndpointNotificationCallback(IntPtr pClient);
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    class MMDeviceEnumerator { }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, out IntPtr ppInterface);
        int OpenPropertyStore(int stgmAccess, out IPropertyStore ppProperties);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
        int GetState(out int pdwState);
    }

    [Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IPropertyStore {
        int GetCount(out int cProps);
        int GetAt(int iProp, out IntPtr pkey);
        int GetValue(ref IntPtr key, out IntPtr pv);
    }

    [Guid("00000000-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceCollection {
        int GetCount(out int pcDevices);
        int Item(int nDevice, out IMMDevice ppDevice);
    }

    public class Program {
        [DllImport("ole32.dll")]
        public static extern int PropVariantClear(IntPtr pvar);

        public static void Main(string[] args) {
            try {
                IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
                IntPtr ppDevicesInst;
                enumerator.EnumAudioEndpoints(1, 1, out ppDevicesInst); // eCapture = 1, DEVICE_STATE_ACTIVE = 1
                IMMDeviceCollection devices = (IMMDeviceCollection)Marshal.GetObjectForIUnknown(ppDevicesInst);

                int count;
                devices.GetCount(out count);
                
                string targetId = null;

                for (int i = 0; i < count; i++) {
                    IMMDevice device;
                    devices.Item(i, out device);
                    
                    IPropertyStore props;
                    device.OpenPropertyStore(0, out props); // STGM_READ = 0
                    
                    // We don't read full property keys, we just check its ID and assume we don't want "CABLE" or "Virtual"
                    string id;
                    device.GetId(out id);
                    if (id != null && !id.ToLower().Contains("vbcable")) {
                        targetId = id;
                        // Let's just pick the first valid non-cable mic
                        break;
                    }
                }

                if (targetId != null) {
                    IPolicyConfig config = (IPolicyConfig)new PolicyConfigClient();
                    config.SetDefaultEndpoint(targetId, 0); // eConsole
                    config.SetDefaultEndpoint(targetId, 1); // eMultimedia
                    config.SetDefaultEndpoint(targetId, 2); // eCommunications
                    Console.WriteLine("Restored Default Mic: " + targetId);
                }
            } catch (Exception ex) {
                Console.WriteLine("Error: " + ex.Message);
            }
        }
    }
}
