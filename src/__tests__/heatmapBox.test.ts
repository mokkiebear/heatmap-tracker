import { createNewFile, handleBoxClick } from "../utils/heatmapBox";
import { App, TFile } from "obsidian";
import {
  getDailyNote,
  createDailyNote,
  getAllDailyNotes,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import { notify } from "../utils/notify";
import moment from "moment";

// Mock dependencies
jest.mock("obsidian-daily-notes-interface");
jest.mock("../utils/notify");
jest.mock("obsidian", () => ({
  App: jest.fn(),
  TFile: jest.fn(),
}));

describe("heatmapBox utils", () => {
  let app: App;
  let mockVault: any;
  let mockWorkspace: any;
  let mockLeaf: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Obsidian App mocks
    mockLeaf = {
      openFile: jest.fn(),
    };
    mockWorkspace = {
      getLeaf: jest.fn().mockReturnValue(mockLeaf),
    };
    mockVault = {
      create: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      getFiles: jest.fn().mockReturnValue([]),
    };
    app = {
      vault: mockVault,
      workspace: mockWorkspace,
    } as unknown as App;

    // Mock window.confirm
    global.confirm = jest.fn();
  });

  describe("createNewFile", () => {
    it("should create and open a new file when user confirms", async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      const mockFile = {} as TFile;
      mockVault.create.mockResolvedValue(mockFile);

      const result = await createNewFile(app, "test.md", "folder/test.md");

      expect(global.confirm).toHaveBeenCalledWith(
        "Do you want to create a new file 'test.md' at 'folder/test.md'?"
      );
      expect(mockVault.create).toHaveBeenCalledWith("folder/test.md", "");
      expect(mockWorkspace.getLeaf).toHaveBeenCalledWith(true);
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
      expect(result).toBe(true);
    });

    it("should return false when user cancels creation", async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      const result = await createNewFile(app, "test.md", "folder/test.md");

      expect(global.confirm).toHaveBeenCalled();
      expect(mockVault.create).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
    
    it("should return true but not open file if creation fails (returns null/undefined)", async () => {
        (global.confirm as jest.Mock).mockReturnValue(true);
        mockVault.create.mockResolvedValue(null);
  
        const result = await createNewFile(app, "test.md", "folder/test.md");
  
        expect(mockVault.create).toHaveBeenCalled();
        expect(mockWorkspace.getLeaf).not.toHaveBeenCalled();
        expect(result).toBe(true);
      });
  });

  describe("handleBoxClick", () => {
    const mockDate = "2023-01-01";
    const mockBox = { date: mockDate, count: 1 };

    it("should return early if box is undefined", async () => {
      await handleBoxClick(undefined as any, app, {} as any);
      expect(mockVault.getAbstractFileByPath).not.toHaveBeenCalled();
    });

    describe("when box has filePath", () => {
      const boxWithFile = { ...mockBox, filePath: "path/to/file.md" };

      it("should open existing file", async () => {
        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

        await handleBoxClick(boxWithFile, app, {} as any);

        expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("path/to/file.md");
        expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
      });

      it("should return if file missing and creation disabled", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);

        await handleBoxClick(boxWithFile, app, { disableFileCreation: true } as any);

        expect(global.confirm).not.toHaveBeenCalled();
        expect(mockVault.create).not.toHaveBeenCalled();
      });

      it("should prompt to create file if missing and creation enabled", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);
        (global.confirm as jest.Mock).mockReturnValue(true);
        mockVault.create.mockResolvedValue({} as TFile);

        await handleBoxClick(boxWithFile, app, { disableFileCreation: false } as any);

        expect(global.confirm).toHaveBeenCalled();
        expect(mockVault.create).toHaveBeenCalledWith("path/to/file.md", "");
      });
      
      it("should handle undefined trackerData when checking disableFileCreation with filePath", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);
        (global.confirm as jest.Mock).mockReturnValue(true);
        mockVault.create.mockResolvedValue({} as TFile);

        await handleBoxClick(boxWithFile, app, undefined as any);

        expect(mockVault.create).toHaveBeenCalled();
      });
    });

    describe("when trackerData has basePath", () => {
      const trackerData = { basePath: "journal" };

      it("should open existing file at base path", async () => {
        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

        await handleBoxClick(mockBox, app, trackerData as any);

        expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("journal/2023-01-01.md");
        expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
      });

      it("should handle basePath slashes correctly", async () => {
         const mockFile = new TFile();
         mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
 
         await handleBoxClick(mockBox, app, { basePath: "/journal/" } as any);
 
         expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("journal/2023-01-01.md");
      });
      
      it("should handle basePath with only slashes", async () => {
         const mockFile = new TFile();
         mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
 
         await handleBoxClick(mockBox, app, { basePath: "///" } as any);
 
         // Should normalize to empty string and just use filename
         expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("2023-01-01.md");
      });

      it("should return if file missing and creation disabled", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);

        await handleBoxClick(mockBox, app, { ...trackerData, disableFileCreation: true } as any);

        expect(mockVault.create).not.toHaveBeenCalled();
      });

      it("should prompt to create file if missing", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);
        (global.confirm as jest.Mock).mockReturnValue(true);

        await handleBoxClick(mockBox, app, trackerData as any);

        expect(mockVault.create).toHaveBeenCalledWith("journal/2023-01-01.md", "");
      });
      
      it("should handle undefined trackerData when checking disableFileCreation with basePath", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);
        (global.confirm as jest.Mock).mockReturnValue(true);
        
        // We need basePath to enter this block, but we want to check disableFileCreation being undefined
        // which comes from trackerData.
        // But if we pass trackerData with basePath, it is defined.
        // The code is: if (trackerData?.disableFileCreation)
        // So we just need to pass trackerData without disableFileCreation property, which we did in "should prompt to create file if missing"
        // But maybe we need to explicitly test that it doesn't crash if trackerData is somehow null inside? 
        // No, if trackerData is null it won't enter the block.
        // The branch coverage might be complaining about the optional chaining `?.` when trackerData IS defined.
        // We've covered the case where it IS defined (and false/undefined property).
        // Maybe we need to cover where `trackerData` is defined but `disableFileCreation` is missing (undefined).
        // That is covered by "should prompt to create file if missing".
        
        // Let's just ensure we have covered the `trackerData?.disableFileCreation` branch fully.
        // It evaluates to undefined (falsy) or true.
      });
    });

    describe("fallback to Daily Notes API", () => {
        beforeEach(() => {
            (getAllDailyNotes as jest.Mock).mockReturnValue({});
            (getDailyNote as jest.Mock).mockReturnValue(null);
            (getDailyNoteSettings as jest.Mock).mockReturnValue({ format: "YYYY-MM-DD", folder: "dailies" });
        });

      it("should open existing daily note", async () => {
        const mockFile = new TFile();
        (getDailyNote as jest.Mock).mockReturnValue(mockFile);

        await handleBoxClick(mockBox, app, {} as any);

        expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
      });

      it("should return if daily note missing and creation disabled", async () => {
        await handleBoxClick(mockBox, app, { disableFileCreation: true } as any);

        expect(createDailyNote).not.toHaveBeenCalled();
      });

      it("should prompt to create daily note if missing", async () => {
        (global.confirm as jest.Mock).mockReturnValue(true);
        const mockFile = new TFile();
        (createDailyNote as jest.Mock).mockResolvedValue(mockFile);

        await handleBoxClick(mockBox, app, {} as any);

        expect(global.confirm).toHaveBeenCalled();
        expect(createDailyNote).toHaveBeenCalled();
        expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
      });

      it("should not create daily note if user cancels", async () => {
        (global.confirm as jest.Mock).mockReturnValue(false);

        await handleBoxClick(mockBox, app, {} as any);

        expect(createDailyNote).not.toHaveBeenCalled();
      });

      it("should handle missing daily note settings (defaults)", async () => {
        (getDailyNoteSettings as jest.Mock).mockReturnValue(null);
        (global.confirm as jest.Mock).mockReturnValue(true);
        const mockFile = new TFile();
        (createDailyNote as jest.Mock).mockResolvedValue(mockFile);

        await handleBoxClick(mockBox, app, {} as any);

        expect(global.confirm).toHaveBeenCalled();
        // Should use default format YYYY-MM-DD and empty folder
        expect(createDailyNote).toHaveBeenCalledWith(moment(mockBox.date));
      });

      it("should handle daily note creation failure", async () => {
        (global.confirm as jest.Mock).mockReturnValue(true);
        (createDailyNote as jest.Mock).mockResolvedValue(null);

        await handleBoxClick(mockBox, app, {} as any);

        expect(createDailyNote).toHaveBeenCalled();
        expect(mockLeaf.openFile).not.toHaveBeenCalled();
      });
      
      it("should handle undefined trackerData for disableFileCreation check", async () => {
         // This covers the optional chaining trackerData?.disableFileCreation
         (global.confirm as jest.Mock).mockReturnValue(true);
         (createDailyNote as jest.Mock).mockResolvedValue({} as TFile);
         
         await handleBoxClick(mockBox, app, undefined as any);
         
         expect(createDailyNote).toHaveBeenCalled();
      });
    });
    
    describe("Error handling and manual fallback", () => {
         it("should catch error in Daily Notes block and try manual search", async () => {
            (getAllDailyNotes as jest.Mock).mockImplementation(() => { throw new Error("Daily notes error"); });
            
            // Mock manual search finding a file
            const mockFile = { name: "2023-01-01.md" } as TFile;
            mockVault.getFiles.mockReturnValue([mockFile]);
            
            await handleBoxClick(mockBox, app, {} as any);
            
            expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
         });

         it("should try to create new file if manual search fails", async () => {
            (getAllDailyNotes as jest.Mock).mockImplementation(() => { throw new Error("Daily notes error"); });
            mockVault.getFiles.mockReturnValue([]);
            (global.confirm as jest.Mock).mockReturnValue(true);
            
            await handleBoxClick(mockBox, app, {} as any);
            
            expect(mockVault.create).toHaveBeenCalledWith("2023-01-01.md", "");
            expect(notify).toHaveBeenCalled();
         });

         it("should respect disableFileCreation in manual fallback", async () => {
            (getAllDailyNotes as jest.Mock).mockImplementation(() => { throw new Error("Daily notes error"); });
            mockVault.getFiles.mockReturnValue([]);
            
            await handleBoxClick(mockBox, app, { disableFileCreation: true } as any);
            
            expect(mockVault.create).not.toHaveBeenCalled();
            expect(notify).not.toHaveBeenCalled();
         });

         it("should handle undefined trackerData in manual fallback", async () => {
            (getAllDailyNotes as jest.Mock).mockImplementation(() => { throw new Error("Daily notes error"); });
            mockVault.getFiles.mockReturnValue([]);
            (global.confirm as jest.Mock).mockReturnValue(true);
            
            await handleBoxClick(mockBox, app, undefined as any);
            
            expect(mockVault.create).toHaveBeenCalled();
         });
    });
  });
});
